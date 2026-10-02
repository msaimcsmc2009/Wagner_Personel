import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

/**
 * Breadcrumb — components.md §Breadcrumb, layout.md §3.
 *
 * `nav > ol` sırası korunur. Ayırıcı metin olarak değil, `aria-hidden` bir
 * `<span>` olarak yazılır: böylece ekran okuyucu ayırıcıyı duymaz. (Kural
 * `::after` önerir; burada aynı erişilebilir sonucu keyfi bir sınıf
 * kullanmadan — yani `[...]` değeri yazmadan — veren eşdeğer çözüm
 * tercih edilmiştir.)
 *
 * Son öğe bağlantı DEĞİLDİR ve `aria-current="page"` taşır.
 */
export interface Crumb {
  label: string;
  /** Son öğe veya `undefined` ise bağlantı render edilmez. */
  to?: string;
}

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Sayfa yolu" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-2 text-label">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className="min-w-0">
                {item.to !== undefined && isLast === false ? (
                  <Link
                    to={item.to}
                    className="text-content-muted transition-colors duration-fast hover:text-content-brand"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined} className="text-content-secondary">
                    {item.label}
                  </span>
                )}
              </li>
              {isLast === false && (
                <li aria-hidden="true" className="text-content-muted">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
