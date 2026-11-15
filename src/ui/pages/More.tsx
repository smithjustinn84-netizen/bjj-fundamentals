import { Link } from 'react-router-dom';
import { settings, useThemeChoice, useVideos } from '../../bindings';
import { KIND_LABELS, plural, THEME_LABELS } from '../../core/labels';
import { ITEM_KINDS, THEME_CHOICES } from '../../core/models';
import { Icon, type IconName } from '../graphics/icons';
import { newItemPath, ROUTES } from '../routes';

const THEME_TITLE_ID = 'theme-title';

function MoreRow({ to, icon, title, detail }: { to: string; icon: IconName; title: string; detail?: string }) {
  return (
    <li>
      <Link className="more-row" to={to}>
        <span className="more-icon">
          <Icon name={icon} />
        </span>
        <span className="grow">
          <strong>{title}</strong>
          {detail && <span className="muted small block">{detail}</span>}
        </span>
        <Icon name="chevron" />
      </Link>
    </li>
  );
}

/** Everything that has no tab of its own: videos, the belt test, adding items and backups. */
export default function More() {
  const videos = useVideos();
  const theme = useThemeChoice();
  return (
    <div className="stack narrow-page">
      <h1>More</h1>
      <section>
        <h2 className="group-title">Your library</h2>
        <ul className="more-list card">
          <MoreRow
            to={ROUTES.videos}
            icon="video"
            title="Videos"
            detail={
              videos && videos.length > 0
                ? `${plural(videos.length, 'bookmark')} at the moment a detail is explained`
                : 'Bookmark the moment a detail is explained'
            }
          />
          <MoreRow
            to={ROUTES.blueBelt}
            icon="belt"
            title="Blue belt test"
            detail="The techniques you will be asked to show"
          />
        </ul>
      </section>
      <section>
        <h2 className="group-title">Add your own</h2>
        <ul className="more-list card">
          {ITEM_KINDS.map((kind) => (
            <MoreRow key={kind} to={newItemPath(kind)} icon="plus" title={`New ${KIND_LABELS[kind].toLowerCase()}`} />
          ))}
        </ul>
      </section>
      <section>
        <h2 className="group-title" id={THEME_TITLE_ID}>
          Appearance
        </h2>
        <fieldset className="segmented" aria-labelledby={THEME_TITLE_ID}>
          {THEME_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={theme === choice}
              onClick={() => void settings.setTheme(choice)}
            >
              {THEME_LABELS[choice]}
            </button>
          ))}
        </fieldset>
      </section>
      <section>
        <h2 className="group-title">Your data</h2>
        <ul className="more-list card">
          <MoreRow
            to={ROUTES.backup}
            icon="backup"
            title="Backup and restore"
            detail="Export everything as a file, or bring one back"
          />
        </ul>
        <p className="muted small more-note">Everything is stored on this device only. Export a backup now and then.</p>
      </section>
    </div>
  );
}
