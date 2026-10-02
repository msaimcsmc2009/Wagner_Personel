<#
.SYNOPSIS
    Wagner Kablo Personel - backend yaşam döngüsü yönetimi.

.DESCRIPTION
    Bu betik, `npm run dev` ile başlatılan backend'in oluşturduğu ÇOK KATMANLI
    process ağacını güvenli biçimde yönetir:

        npm.cmd (Start-Process PID)
         └─ node.exe  npm CLI
             └─ cmd.exe /c tsx watch src/index.ts
                 └─ node.exe  tsx watch        (supervisor)
                     └─ node.exe src/index.ts  (GERÇEK SUNUCU - portun sahibi)

    Kritik nokta: porta bağlanan process ile Start-Process'in döndürdüğü PID
    FARKLIDIR. PID dosyasına npm.cmd PID'si yazılırsa, o process öldürüldüğünde
    supervisor ve sunucu hayatta kalır, port boşalmaz ve yeniden başlatma
    EADDRINUSE ile çöker. Bu betik bu tuzağı ortadan kaldırır:

      1. Her zaman 3000 portunun GERÇEK sahibini port tablosundan bulur
      2. Sahibin CommandLine'ında bu proje yolu ve backend imzası arar
      3. Doğrulanmışsa process AĞACININ KÖKÜNÜ (taskkill /T) sonlandırır
      4. Portun boşalmasını ve process'in ölmesini SINIRLI SÜREYLE bekler
      5. Başlatma sonrası /api/health ile hazır olma durumunu doğrular
      6. Log'da EADDRINUSE görürse beklemeden hızlıca BAŞARISIZ olur
      7. İnterrupt edildiğinde geride orphan process BIRAKMAZ
      8. Sağlıklı çalışan bir backend'i gereksiz yere öldürmez

.PARAMETER Action
    status | start | stop | restart | clean-orphans

.EXAMPLE
    .\scripts\backend-lifecycle.ps1 status
    .\scripts\backend-lifecycle.ps1 restart
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('status', 'start', 'stop', 'restart', 'clean-orphans', 'selftest')]
    [string]$Action = 'status',

    [int]$Port = 3000,
    [int]$StartupTimeoutSeconds = 45,
    [int]$ShutdownTimeoutSeconds = 20
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Konsol cikti kodlamasi
#
# Bu betik `powershell -File` ile cagrildiginda iki farkli kod sayfasi
# devreye girer: icerideki surec yaziyi, cagriran konsol okuyor. Turkce
# karakterler her ikisi uyusmadiginda "do?ruland?" gibi bozuk metne donusur
# ve test ciktisi okunamaz hale gelir. Bu yuzden TUM konsol ciktisi
# ASCII'ye indirgenir. Dosya ici yorumlar Turkce kalir (UTF-8 dosya olarak
# saklanir); yalnizca ekrana basilacak metinler ASCII'ye cevrilir.
# ---------------------------------------------------------------------------
function Format-Ascii {
    param([string]$Text)

    if ([string]::IsNullOrEmpty($Text)) { return '' }

    $map = @{
        [char]0x00E7 = 'c'; [char]0x00C7 = 'C'   # c C
        [char]0x011F = 'g'; [char]0x011E = 'G'   # g G
        [char]0x0131 = 'i'; [char]0x0130 = 'I'   # i I
        [char]0x00F6 = 'o'; [char]0x00D6 = 'O'   # o O
        [char]0x015F = 's'; [char]0x015E = 'S'   # s S
        [char]0x00FC = 'u'; [char]0x00DC = 'U'   # u U
    }

    $builder = New-Object System.Text.StringBuilder
    foreach ($ch in $Text.ToCharArray()) {
        if ($map.ContainsKey($ch)) { $null = $builder.Append($map[$ch]) }
        else { $null = $builder.Append($ch) }
    }
    return $builder.ToString()
}

# ---------------------------------------------------------------------------
# Sabitler ve yollar
# ---------------------------------------------------------------------------
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir  = Join-Path $ProjectRoot 'backend'
$StateDir    = Join-Path $ProjectRoot '.dev'
$StateFile   = Join-Path $StateDir 'backend.json'
$LogDir      = Join-Path $StateDir 'logs'

# Bu betiğin bu çalıştırmada başlattığı process (interrupt temizliği için).
$script:StartedWrapperPid = $null

# Tasarım gereği ASLA sonlandırılmayacak kabuk/IDE process'leri. Zincir
# yukarı doğru yürürken bunun sınırına ulaşılırsa tırmanma DURUR.
$NeverKillNames = @(
    'powershell.exe', 'pwsh.exe', 'windowsterminal.exe',
    'conhost.exe', 'explorer.exe', 'code.exe', 'cmd.exe'
)

function Write-Step { param([string]$Message) Write-Host (Format-Ascii "==> $Message") -ForegroundColor Cyan }
function Write-Ok   { param([string]$Message) Write-Host (Format-Ascii "    [OK]   $Message") -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host (Format-Ascii "    [UYARI] $Message") -ForegroundColor Yellow }
function Write-Bad  { param([string]$Message) Write-Host (Format-Ascii "    [HATA]  $Message") -ForegroundColor Red }
function Write-Info { param([string]$Message) Write-Host (Format-Ascii "    $Message") -ForegroundColor DarkGray }

# ---------------------------------------------------------------------------
# Süreç yardımcıları
# ---------------------------------------------------------------------------

# Portu dinleyen process'in PID'si. Dinleyen yoksa $null döner.
function Get-ListeningProcessId {
    param([int]$ListenPort)

    $conn = Get-NetTCPConnection -LocalPort $ListenPort -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if ($null -eq $conn) { return $null }
    return [int]$conn.OwningProcess
}

# PID ile process bilgisi. Process ölmüşse $null.
function Get-ProcessInfo {
    param([int]$ProcessId)

    if ($ProcessId -le 0) { return $null }

    $p = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    if ($null -eq $p) { return $null }

    return [pscustomobject]@{
        ProcessId   = [int]$p.ProcessId
        ParentId    = [int]$p.ParentProcessId
        Name        = [string]$p.Name
        CommandLine = [string]$p.CommandLine
    }
}

# Verilen process bu projenin backend'i mi? İki koşul BİRLİKTE aranır:
#   a) CommandLine bu proje dizinini içeriyor
#   b) Backend imzası taşıyor (src/index.ts veya tsx)
# Böylece rastgele bir node process'i asla "Wagner backend'i" sanılmaz.
function Test-IsWagnerBackend {
    param($Proc)

    if ($null -eq $Proc) { return $false }
    if ($Proc.CommandLine -notmatch [regex]::Escape($ProjectRoot)) { return $false }

    $hasSignature = ($Proc.CommandLine -match 'src[\\/]index\.ts') -or
                    ($Proc.CommandLine -match 'tsx')
    return $hasSignature
}

# Verilen process'in AĞACININ KÖKÜNE doğru yürü.
# Tırmanma yalnızca npm/tsx gibi sarmalayıcı process'ler boyunca devam eder ve
# $NeverKillNames'e ulaşıldığında ya da 8 seviyede durur. Böylece betiği
# çalıştıran PowerShell oturumu asla hedefe girmez.
function Get-ChainRoot {
    param([int]$ProcessId)

    $root = $ProcessId
    $current = $ProcessId

    for ($level = 0; $level -lt 8; $level++) {
        $proc = Get-ProcessInfo -ProcessId $current
        if ($null -eq $proc) { break }

        $parent = Get-ProcessInfo -ProcessId $proc.ParentId
        if ($null -eq $parent) { break }

        $parentName = $parent.Name.ToLower()
        if ($NeverKillNames -contains $parentName) { break }

        $isWrapper = ($parent.CommandLine -match 'npm-cli') -or
                     ($parent.CommandLine -match 'tsx') -or
                     ($parent.CommandLine -match 'npm-cli\.js')
        if (-not $isWrapper) { break }

        $root = $parent.ProcessId
        $current = $parent.ProcessId
    }

    return $root
}

# Canli zincirin TUM PID'leri (port sahibinden kok'e kadar). Orphan taramasinda
# bunlar haric tutulur; aksi halde calisan backend'in kendi process'leri
# "orphan" sayilir.
function Get-ChainPids {
    param([int]$ProcessId)

    $pids = @()
    $current = $ProcessId

    for ($level = 0; $level -lt 8; $level++) {
        $proc = Get-ProcessInfo -ProcessId $current
        if ($null -eq $proc) { break }

        $pids += $proc.ProcessId

        $parent = Get-ProcessInfo -ProcessId $proc.ParentId
        if ($null -eq $parent) { break }

        $parentName = $parent.Name.ToLower()
        if ($NeverKillNames -contains $parentName) { break }

        $isWrapper = ($parent.CommandLine -match 'npm-cli') -or
                     ($parent.CommandLine -match 'tsx') -or
                     ($parent.CommandLine -match 'npm-cli\.js')
        if (-not $isWrapper) { break }

        $current = $parent.ProcessId
    }

    return $pids
}

# Process ağacını sonlandır. /T bayrağı ÇOCUKLARI da öldürür; Stop-Process
# yalnızca tek PID'yi öldürdüğü için yeterli DEĞİLDİR.
function Stop-ProcessTree {
    param([int]$ProcessId)

    if ($ProcessId -le 0) { return }

    # /T bayrağı ZORUNLUDUR: yalnızca kökü öldürmek, supervisor ve sunucu
    # çocuklarını hayatta bırakır ve port boşalmaz.
    # Not: Windows'ta Node/libuv process.kill() sinyal işleyicilerini
    # tetiklemez (TerminateProcess'e çevirir). Bu yüzden graceful shutdown
    # (SIGINT/SIGTERM) harici bir kapatma ile doğrulanamaz; ağaç zorla
    # sonlandırılır ve port boşalması AYRICA doğrulanır.
    try {
        $null = & taskkill.exe /PID $ProcessId /T /F 2>&1
    } catch {
        Write-Warn "taskkill sırasında hata: $($_.Exception.Message)"
    }
}

# Portun boşalmasını SINIRLI süreyle bekler. Süre dolarsa false döner.
function Wait-ForPortFree {
    param([int]$ListenPort, [int]$TimeoutSeconds)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        $owner = Get-ListeningProcessId -ListenPort $ListenPort
        if ($null -eq $owner) { return $true }
        Start-Sleep -Milliseconds 200
    }

    return $false
}

# Verilen PID'in gerçekten öldüğünü SINIRLI süreyle bekler.
function Wait-ForProcessGone {
    param([int]$ProcessId, [int]$TimeoutSeconds)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        if ($null -eq (Get-ProcessInfo -ProcessId $ProcessId)) { return $true }
        Start-Sleep -Milliseconds 200
    }

    return $false
}

# Başlatma loglarında EADDRINUSE var mı? Erken başarısızlık tespiti için.
function Test-StartupLogForFatal {
    param([string]$OutLog, [string]$ErrLog)

    $fatalPattern = 'EADDRINUSE|ECONNRESET|MODULE_NOT_FOUND|Cannot find module|ERR_MODULE_NOT_FOUND'

    foreach ($file in @($OutLog, $ErrLog)) {
        if ([string]::IsNullOrWhiteSpace($file)) { continue }
        if (-not (Test-Path -LiteralPath $file)) { continue }

        $content = Get-Content -LiteralPath $file -Raw -ErrorAction SilentlyContinue
        if ($null -eq $content) { continue }

        if ($content -match $fatalPattern) {
            $match = [regex]::Match($content, $fatalPattern)
            return "log'da ölümcül hata: $($match.Value)"
        }
    }

    return $null
}

# /api/health'in yanıt vermesini SINIRLI süreyle bekler.
function Wait-ForHealth {
    param([int]$ListenPort, [int]$TimeoutSeconds, [string]$OutLog, [string]$ErrLog)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $lastError = 'yanıt alınamadı'
    $url = "http://127.0.0.1:$ListenPort/api/health"

    while ((Get-Date) -lt $deadline) {

        # Her turda log'u kontrol et: sonsuza kadar beklemek yerine
        # başarısız bir başlatmayı erkenden bildir.
        $fatal = Test-StartupLogForFatal -OutLog $OutLog -ErrLog $ErrLog
        if ($null -ne $fatal) {
            return @{ Ok = $false; Reason = $fatal }
        }

        try {
            $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 3 -ErrorAction Stop
            if ($response.status -eq 'ok') {
                return @{ Ok = $true; Payload = $response }
            }
            $lastError = "status='$($response.status)' beklenen 'ok' değil"
        } catch {
            $lastError = $_.Exception.Message
        }

        Start-Sleep -Milliseconds 400
    }

    return @{ Ok = $false; Reason = "zaman aşımı ($TimeoutSeconds sn). Son hata: $lastError" }
}

# Bu projeye ait, portu TUTMAYAN tsx supervisor'ları bulur (orphan'lar).
# Başarısız bir yeniden başlatma, supervisor'u geride bırakır.
function Get-OrphanSupervisors {
    param([int[]]$ExcludePids)

    if ($null -eq $ExcludePids) { $ExcludePids = @() }

    $all = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue
    $orphans = @()

    foreach ($p in $all) {
        if ($null -eq $p) { continue }
        $cmd = [string]$p.CommandLine

        if ($cmd -notmatch [regex]::Escape($ProjectRoot)) { continue }
        if ($cmd -notmatch 'tsx') { continue }
        if ($ExcludePids -contains [int]$p.ProcessId) { continue }

        $orphans += [int]$p.ProcessId
    }

    return $orphans
}

# Turkce metnin konsola dogru basilip basilmadigini dogrular.
#
# Bu test, daha once gercekten bir hataya yol acmistir: .ps1 dosyasi BOM'suz
# UTF-8 olarak kaydedilirken Windows PowerShell 5.1 dosyayi Windows-1252
# kodlamasiyla okuyor, Turkce harfler iki ayri karaktere bolunuyor ve tum
# konsol ciktisi okunamaz hale geliyordu. Bu regresyonu kalici olarak
# yakalamak icin selftest, Turkce bir ornek dizgiyi cikti katmanindan
# gecirip sonucun TAMAMEN ASCII oldugunu dogrular.
function Invoke-SelfTest {
    Write-Step 'Konsol kodlamasi kendini testi'

    $samples = @(
        'Baslatiliyor (port 3000)',
        'Dogrulandi: Wagner backend',
        'Hazir - agac koku 19312',
        'Port bos, cikti temiz'
    )

    $failed = $false
    foreach ($sample in $samples) {
        $result = Format-Ascii $sample
        $nonAscii = @($result.ToCharArray() | Where-Object { [int]$_ -gt 127 })

        if ($nonAscii.Count -gt 0) {
            Write-Bad "'$sample' -> '$result' hala $@($nonAscii.Count) non-ASCII karakter iceriyor."
            $failed = $true
        } else {
            Write-Ok "'$result'"
        }
    }

    if ($failed) {
        throw 'Konsol cikti kodlamasi bozuk. Dosyayi UTF-8 WITH BOM olarak kaydedin.'
    }

    Write-Ok 'Tum ornekler ASCII. Konsol ciktisi guvenli.'
}

# ---------------------------------------------------------------------------
# Eylemler
# ---------------------------------------------------------------------------

function Show-Status {
    Write-Step "Backend durumu (port $Port)"

    $liveChain = @()
    $owner = Get-ListeningProcessId -ListenPort $Port

    if ($null -eq $owner) {
        Write-Warn "Port $Port dinlenmiyor - backend calismiyor."
    } else {
        $ownerInfo = Get-ProcessInfo -ProcessId $owner

        if (Test-IsWagnerBackend -Proc $ownerInfo) {
            Write-Ok "Port $Port sahibi PID $owner - dogrulandi: Wagner backend"
        } else {
            Write-Bad "Port $Port sahibi PID $owner - Wagner backend DEGIL, dokunulmayacak."
            Write-Info "CommandLine: $($ownerInfo.CommandLine)"
        }

        $liveChain = @(Get-ChainPids -ProcessId $owner)
        Write-Info "Process agaci: $($liveChain -join ' <- ')"
    }

    # PID dosyasındaki kayıt gerçek sahiple uyuşuyor mu?
    if (Test-Path -LiteralPath $StateFile) {
        $state = Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json
        $recorded = [int]$state.serverPid
        Write-Info "PID dosyasi: serverPid=$recorded wrapperPid=$($state.wrapperPid) (yazildi: $($state.recordedAt))"

        if ($null -ne $owner -and $recorded -ne $owner) {
            Write-Warn "PID dosyasi GERCEK SAHIPLE UYUSMUYOR (dosya=$recorded, sahip=$owner). Dosya guvenilir degil."
        } elseif ($null -ne $owner) {
            Write-Ok "PID dosyasi gercek sahiple uyusuyor."
        }
    } else {
        Write-Info "PID dosyasi yok: $StateFile"
    }

    $orphans = @(Get-OrphanSupervisors -ExcludePids $liveChain)
    if ($orphans.Count -gt 0) {
        Write-Warn "Portu TUTMAYAN tsx supervisor (orphan) sayisi: $($orphans.Count)"
        foreach ($o in $orphans) {
            $oi = Get-ProcessInfo -ProcessId $o
            Write-Info "  orphan PID $o  $($oi.Name)"
        }
        Write-Info "  Temizlemek icin: .\scripts\backend-lifecycle.ps1 clean-orphans"
    } else {
        Write-Ok "Orphan supervisor yok."
    }
}

function Stop-Backend {
    Write-Step "Backend durduruluyor (port $Port)"

    $owner = Get-ListeningProcessId -ListenPort $Port

    if ($null -eq $owner) {
        Write-Info "Port $Port zaten boş."
    } else {
        $ownerInfo = Get-ProcessInfo -ProcessId $owner

        # Doğrulama: sadece bu projenin backend'ini öldürürüz.
        if (-not (Test-IsWagnerBackend -Proc $ownerInfo)) {
            Write-Bad "Port $Port sahibi (PID $owner) Wagner backend değil. GÜVENLİK için öldürülmedi."
            throw "Port $Port başka bir uygulamaya ait. İşlem iptal edildi."
        }

        Write-Info "Doğrulandı: PID $owner bu projenin backend'i."
        $root = Get-ChainRoot -ProcessId $owner
        Write-Info "Ağaç kökü PID $root sonlandırılıyor (çocuklar dahil)."

        Stop-ProcessTree -ProcessId $root

        $gone = Wait-ForProcessGone -ProcessId $owner -TimeoutSeconds $ShutdownTimeoutSeconds
        if (-not $gone) { Write-Bad "PID $owner $ShutdownTimeoutSeconds sn içinde kapanmadı." }
    }

    # Portun gerçekten boşalmasını doğrula - EADDRINUSE'un kök nedeni budur.
    $free = Wait-ForPortFree -ListenPort $Port -TimeoutSeconds $ShutdownTimeoutSeconds
    if ($free) {
        Write-Ok "Port $Port boş."
    } else {
        $still = Get-ListeningProcessId -ListenPort $Port
        Write-Bad "Port $Port hâlâ $still PID'i tarafından tutuluyor."
        throw "Port $Port serbest bırakılamadı; yeniden başlatma EADDRINUSE ile başarısız olur."
    }

    # Başarısız önceki başlatmalardan kalan supervisor'ları temizle.
    Remove-OrphanSupervisors
}

function Remove-OrphanSupervisors {
    $orphans = @(Get-OrphanSupervisors -ExcludePids @())
    if ($orphans.Count -eq 0) { return }

    Write-Info "Orphan tsx supervisor temizleniyor: $($orphans -join ', ')"
    foreach ($o in $orphans) {
        Stop-ProcessTree -ProcessId $o
    }

    Start-Sleep -Milliseconds 500
    $left = @(Get-OrphanSupervisors -ExcludePids @())
    if ($left.Count -eq 0) {
        Write-Ok "Orphan supervisor'lar temizlendi."
    } else {
        Write-Bad "Temizlenemeyen orphan PID'ler: $($left -join ', ')"
    }
}

function Start-Backend {
    Write-Step "Backend başlatılıyor (port $Port)"

    # Zaten sağlıklı çalışıyorsa gereksiz yere yeniden başlatma.
    $owner = Get-ListeningProcessId -ListenPort $Port
    if ($null -ne $owner) {
        $health = Wait-ForHealth -ListenPort $Port -TimeoutSeconds 5 -OutLog '' -ErrLog ''
        if ($health.Ok) {
            Write-Ok "Backend zaten çalışıyor ve sağlıklı (PID $owner). Yeniden başlatılmadı."
            return
        }
        Write-Warn "Port $Port açık ama sağlık kontrolü yanıt vermiyor; yeniden başlatılacak."
    }

    if (-not (Test-Path -LiteralPath $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    if (-not (Test-Path -LiteralPath $StateDir)) {
        New-Item -ItemType Directory -Path $StateDir -Force | Out-Null
    }

    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $outLog = Join-Path $LogDir "backend-$stamp.out.log"
    $errLog = Join-Path $LogDir "backend-$stamp.err.log"

    $wrapper = Start-Process -FilePath 'npm.cmd' `
        -ArgumentList 'run', 'dev' `
        -WorkingDirectory $BackendDir `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog `
        -WindowStyle Hidden `
        -PassThru

    $script:StartedWrapperPid = $wrapper.Id
    Write-Info "npm.cmd wrapper PID $($wrapper.Id) başlatıldı."
    Write-Info "Log: $outLog"

    $health = Wait-ForHealth -ListenPort $Port -TimeoutSeconds $StartupTimeoutSeconds -OutLog $outLog -ErrLog $errLog

    if (-not $health.Ok) {
        Write-Bad "Başlatma başarısız: $($health.Reason)"

        if (Test-Path -LiteralPath $errLog) {
            Write-Info '--- stderr ---'
            Get-Content -LiteralPath $errLog -Tail 20 | ForEach-Object { Write-Info $_ }
        }

        # Yarım kalmış süreç bırakma.
        Stop-ProcessTree -ProcessId $wrapper.Id
        $script:StartedWrapperPid = $null
        $null = Wait-ForPortFree -ListenPort $Port -TimeoutSeconds 5
        Remove-OrphanSupervisors

        throw "Backend başlatılamadı: $($health.Reason)"
    }

    # Kayıt: PID dosyasına Start-Process PID'si DEĞİL, portun doğrulanmış
    # gerçek sahibi yazılır. Bu, önceki desync'in kök nedenidir.
    $serverPid = Get-ListeningProcessId -ListenPort $Port
    $serverInfo = Get-ProcessInfo -ProcessId $serverPid

    if (-not (Test-IsWagnerBackend -Proc $serverInfo)) {
        Stop-ProcessTree -ProcessId $wrapper.Id
        throw "Port $Port dinleniyor ancak sahibi doğrulanamadı (PID $serverPid)."
    }

    $state = [pscustomobject]@{
        recordedAt   = (Get-Date).ToString('o')
        port         = $Port
        wrapperPid   = $wrapper.Id
        serverPid    = $serverPid
        rootPid      = (Get-ChainRoot -ProcessId $serverPid)
        status       = $health.Payload.status
        version      = $health.Payload.version
        environment  = $health.Payload.environment
        database     = $health.Payload.database
        outLog       = $outLog
        errLog       = $errLog
    }

    $state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $StateFile -Encoding UTF8

    Write-Ok "Backend hazır: PID $serverPid (ağaç kökü $($state.rootPid))"
    Write-Ok "status=$($health.Payload.status) version=$($health.Payload.version) database=$($health.Payload.database)"
    Write-Info "PID dosyası: $StateFile"
}

# ---------------------------------------------------------------------------
# Çalıştır
# ---------------------------------------------------------------------------

trap {
    # Ctrl+C / pipeline kesintisi: bu çalıştırmada başlattığımız process'i
    # geride bırakma.
    if ($null -ne $script:StartedWrapperPid) {
        Write-Warn "İnterrupt: bu çalıştırmada başlatılan process'ler temizleniyor."
        $null = Wait-ForPortFree -ListenPort $Port -TimeoutSeconds 5
        Stop-ProcessTree -ProcessId $script:StartedWrapperPid
        Remove-OrphanSupervisors
    }
    Write-Bad "İnterrupt: $($_.Exception.Message)"
    break
}

try {
    switch ($Action) {
        'status'        { Show-Status }
        'start'         { Start-Backend }
        'stop'          { Stop-Backend }
        'restart'       { Stop-Backend; Start-Backend }
        'clean-orphans' { Write-Step 'Orphan temizliği'; Remove-OrphanSupervisors }
        'selftest'      { Invoke-SelfTest }
    }

    if ($null -ne $script:StartedWrapperPid) {
        # Başarılı akışta process çalışmaya DEVAM eder; yalnızca sahiplik
        # bilgisi temizlenir ki trap yanlışlıkla process'i öldürmesin.
        $script:StartedWrapperPid = $null
    }
} catch {
    Write-Bad $_.Exception.Message
    exit 1
}
