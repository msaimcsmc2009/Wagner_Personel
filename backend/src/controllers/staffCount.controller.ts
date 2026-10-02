import type { Request, Response } from 'express';
import {
  getCurrentStaffCounts,
  getStaffCountHistory,
  patchStaffCountCategory,
  type StaffCategory,
} from '../services/staffCount.service.js';
import { AppError } from '../utils/AppError.js';

function parseCategory(value: unknown): StaffCategory | null {
  if (value === 'Üretim' || value === 'Endirekt') return value;
  return null;
}

function parseLimit(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 500) return undefined;
  return Math.trunc(n);
}

function parseHeadcount(value: unknown): number {
  const n = Number(value);
  return n;
}

export async function getCurrentCounts(_req: Request, res: Response) {
  const state = await getCurrentStaffCounts();
  res.json(state);
}

export async function patchCounts(req: Request, res: Response) {
  const userId = req.user?.id;
  if (userId === undefined) {
    throw new AppError(401,'unauthorized','Unauthorized');
  }

  const category = parseCategory(req.body?.category);
  if (category === null) {
    throw new AppError(400,'invalid_category','Geçersiz kategori');
  }

  const hc = parseHeadcount(req.body?.headcount);
  if (!Number.isFinite(hc) || hc < 0 || hc > 100000) {
    throw new AppError(400,'invalid_headcount','Geçersiz personel sayısı');
  }

  const updated = await patchStaffCountCategory(category, hc, userId);

  /*
    `total` YANITTA DÖNER. Sözleşme (`types/staffCount.ts`
    `UpdateStaffCountResponse`) güncel değerle birlikte toplamı da vaat eder;
    yanıtta bulunmaması sözleşmeyi tutmaz duruma düşürür.

    Toplam BURADA hesaplanmaz, `getCurrentStaffCounts()`'ten alınır: dashboard
    ile bu uç aynı hesaplamayı kullanır. İki ayrı toplam hesabı, iki uçta
    farklı sayı gösterme riski demektir.
  */
  const state = await getCurrentStaffCounts();

  res.json({
    category: updated.category,
    headcount: updated.headcount,
    updatedAt: updated.updatedAt,
    total: state.total,
  });
}

export async function getHistory(req: Request, res: Response) {
  const category = parseCategory(req.query?.category);
  const limit = parseLimit(req.query?.limit);

  const history = await getStaffCountHistory({
    category: category ?? undefined,
    limit,
  });

  /*
    Yanıt `{ data: [...] }` ZARFI İÇİNDE döner — `StaffCountHistoryResponse`
    sözleşmesinin gerektirdiği gibi.

    ⚠ Burada çıplak dizi döndürmek ekranı sessizce bozuyordu: frontend
      gövdeyi doğrudan dizi sanıp `data` alanını okuyor, `data` `undefined`
      oluyor ve `state.data.length` okuması render sırasında patlıyordu.
      Sonuç: ErrorBoundary olmadığı için beyaz ekran.

      Zarf, servisin kendisinde değil KONTROLLERDA uygulanır: servis ham
      veriyi döner, gövde biçimi HTTP sözleşmesidir ve burada tanımlanır.
  */
  res.json({ data: history });
}
