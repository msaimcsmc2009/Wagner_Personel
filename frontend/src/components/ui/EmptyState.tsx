import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { UsersIcon } from '../icons/UiIcons';

/**
 * Boş durum — components.md §Empty state.
 *
 * En sık görülen ilk ekrandır; sonradan düşünülmez. DÖRT türü vardır ve her
 * biri FARKLI metin ve FARKLI eylem ister. `kind` hangisi olduğunu söyler,
 * böylece filtreli boş bir tablo "Henüz kayıt yok" yazmaz.
 *
 * `filtered` ve `noResults` türlerinde çıkarılabilir filtre çipleri gösterilir:
 * boş bir tablo açıklamasız kaldığında kullanıcı verinin SİLİNDİĞİNİ sanır.
 *
 * ⚠ Metinler DOMAİN-NÖTR yazılmıştır. Bu uygulamada personelin KENDİSİ
 * saklanmaz; yalnızca "Üretim" ve "Endirekt" için SAYI tutulur. Bileşen
 * "personel kaydı ekleyin" gibi bir metin taşıyamaz, çünkü bu yanlıştır ve
 * kullanıcıyı var olmayan bir eyleme yönlendirir. Alan adına özel metin
 * gereken yerlerde `title` / `body` ile geçersiz kılınır.
 */
export type EmptyKind = 'first-use' | 'filtered' | 'no-results' | 'no-permission';

const COPY: Record<EmptyKind, { title: string; body: string }> = {
  'first-use': {
    title: 'Henüz veri yok',
    body: 'Gösterilecek kayıt bulunmuyor. İlk kaydı oluşturduğunuzda burada listelenir.',
  },
  filtered: {
    title: 'Bu filtreye uyan kayıt yok',
    body: 'Seçili filtreleri temizleyerek tüm kayıtları görebilirsiniz.',
  },
  'no-results': {
    title: 'Arama sonucu bulunamadı',
    body: 'Arama terimini değiştirmeyi veya filtreleri temizlemeyi deneyin.',
  },
  'no-permission': {
    title: 'Bu kayıtlara erişiminiz yok',
    body: 'Erişim için yöneticinizden yetki talep edebilirsiniz.',
  },
};

export interface EmptyStateProps {
  kind?: EmptyKind;
  /** `kind` metnini geçersiz kılar. Alan adına özel boş durumlar için. */
  title?: string;
  /** `kind` metnini geçersiz kılar. */
  body?: string;
  /** `no-results` türünde arama terimi metne eklenir. */
  searchTerm?: string;
  icon?: ReactNode;
  /** Filtreli boş durumda çıkarılabilir çipler. */
  chips?: ReactNode;
  /** En fazla birincil ve bir alternatif eylem. */
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({
  kind = 'first-use',
  title,
  body,
  searchTerm,
  icon,
  chips,
  actions,
  className,
}: EmptyStateProps) {
  const copy = COPY[kind];
  const resolvedTitle = title ?? copy.title;
  const resolvedBody = body ?? copy.body;

  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {/* 48px, `text-muted` — asla büyük marka renkli bir illüstrasyon. */}
      <span aria-hidden="true" className="mb-4 text-content-muted">
        {icon ?? <UsersIcon className="size-12" />}
      </span>

      <div className="flex max-w-120 flex-col gap-2">
        <h3 className="text-h3 font-semibold text-content-primary">
          {resolvedTitle}
          {kind === 'no-results' && searchTerm !== undefined && searchTerm !== '' ? (
            <span className="text-content-brand"> “{searchTerm}”</span>
          ) : null}
        </h3>
        <p className="text-body text-content-muted">{resolvedBody}</p>
      </div>

      {chips !== undefined && chips !== null && <div className="mt-5 flex flex-wrap justify-center gap-2">{chips}</div>}

      {actions !== undefined && actions !== null && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
