import { cn } from '../../lib/cn';
import { ChevronLeftIcon, ChevronRightSmallIcon } from '../icons/UiIcons';

/**
 * Sayfalama — components.md §Pagination.
 *
 * Her zaman toplam gösterilir ("1–25 / 248 kayıt") — bu, sayfa büyüklüğü
 * seçicisi ile birlikte TOOLBAR'da yaşar, burada değil.
 *
 * Görünüm: ilk sayfa, son sayfa, çevre sayfalar, aralarında `…`.
 */
export interface PaginationProps {
  /** 1 tabanlı geçerli sayfa. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** `1 … 4 5 6 … 24` biçiminde görünecek sayfa numaraları. */
export function pageWindow(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, pageCount, page]);

  if (page - 1 > 1) pages.add(page - 1);
  if (page + 1 < pageCount) pages.add(page + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];

  let previous = 0;
  for (const value of sorted) {
    if (previous !== 0 && value - previous > 1) {
      out.push('gap');
    }
    out.push(value);
    previous = value;
  }

  return out;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;

  const buttonBase = cn(
    'inline-flex min-h-10 min-w-10 items-center justify-center rounded-sm border px-2',
    'text-label font-medium transition-colors duration-fast',
    'disabled:cursor-not-allowed disabled:opacity-45',
  );

  return (
    <nav aria-label="Sayfalama" className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => {
          onPageChange(page - 1);
        }}
        disabled={page <= 1}
        aria-label="Önceki sayfa"
        className={cn(buttonBase, 'border-line-strong bg-surface text-content-secondary hover:bg-surface-sunken')}
      >
        <ChevronLeftIcon className="size-4" />
      </button>

      {pageWindow(page, pageCount).map((entry) =>
        entry === 'gap' ? (
          <span key="gap" aria-hidden="true" className="px-1 text-content-muted">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => {
              onPageChange(entry);
            }}
            aria-label={`${entry}. sayfa`}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(
              buttonBase,
              entry === page
                ? 'border-brand bg-brand text-content-inverse'
                : 'border-line-strong bg-surface text-content-secondary hover:bg-surface-sunken',
            )}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => {
          onPageChange(page + 1);
        }}
        disabled={page >= pageCount}
        aria-label="Sonraki sayfa"
        className={cn(buttonBase, 'border-line-strong bg-surface text-content-secondary hover:bg-surface-sunken')}
      >
        <ChevronRightSmallIcon className="size-4" />
      </button>
    </nav>
  );
}
