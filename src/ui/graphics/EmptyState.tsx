import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';

/** A friendly placeholder for a screen or section with nothing in it yet: a brushed circle, a line of help, an action. */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-art" aria-hidden="true">
        <svg className="enso" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M72 18C52 6 24 14 15 38c-9 25 6 50 32 53 27 3 46-20 40-45-2-9-7-16-13-21" />
        </svg>
        <Icon name={icon} />
      </div>
      <h2>{title}</h2>
      <p className="muted">{children}</p>
      {action}
    </div>
  );
}
