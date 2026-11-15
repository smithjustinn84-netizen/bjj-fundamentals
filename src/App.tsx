import type { MouseEvent } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useDueCount } from './bindings';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { BrandMark } from './ui/graphics/BrandMark';
import { Icon } from './ui/graphics/icons';
import Backup from './ui/pages/Backup';
import BlueBelt from './ui/pages/BlueBelt';
import ConceptDetail from './ui/pages/ConceptDetail';
import Concepts from './ui/pages/Concepts';
import EditorPage from './ui/pages/editor/EditorPage';
import Home from './ui/pages/Home';
import NotFound from './ui/pages/NotFound';
import PositionDetail from './ui/pages/PositionDetail';
import Positions from './ui/pages/Positions';
import Review from './ui/pages/Review';
import TransitionDetail from './ui/pages/TransitionDetail';
import Videos from './ui/pages/Videos';
import { ROUTE_PATTERNS, ROUTES } from './ui/routes';

const MAIN_ID = 'main';

/** The app uses hash routing, so a plain `#main` link would navigate. Move focus by hand instead. */
function focusMain(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  document.getElementById(MAIN_ID)?.focus();
}

function ReviewNavLink() {
  const dueCount = useDueCount();
  return (
    <NavLink to={ROUTES.review}>
      <Icon name="review" />
      Review
      {dueCount > 0 && (
        <span className="badge" role="img" aria-label={`${dueCount} due`}>
          {dueCount}
        </span>
      )}
    </NavLink>
  );
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <div className="app">
      <a className="skip-link" href={`#${MAIN_ID}`} onClick={focusMain}>
        Skip to content
      </a>
      <header className="topbar">
        <NavLink to={ROUTES.home} className="brand" end>
          <BrandMark />
          BJJ Fundamentals
        </NavLink>
        <nav className="nav" aria-label="Main">
          <NavLink to={ROUTES.concepts}>
            <Icon name="concepts" />
            Concepts
          </NavLink>
          <NavLink to={ROUTES.positions}>
            <Icon name="map" />
            Positions
          </NavLink>
          <NavLink to={ROUTES.blueBelt}>
            <Icon name="belt" />
            Blue belt
          </NavLink>
          <ErrorBoundary>
            <ReviewNavLink />
          </ErrorBoundary>
          <NavLink to={ROUTES.videos}>
            <Icon name="video" />
            Videos
          </NavLink>
          <NavLink to={ROUTES.backup}>
            <Icon name="backup" />
            Backup
          </NavLink>
        </nav>
      </header>
      {/* Keyed on the path so each page plays its entrance animation when the route changes. */}
      <main id={MAIN_ID} className="content page-enter" key={pathname} tabIndex={-1}>
        <ErrorBoundary>
          <Routes>
            <Route path={ROUTES.home} element={<Home />} />
            <Route path={ROUTES.concepts} element={<Concepts />} />
            <Route path={ROUTE_PATTERNS.concept} element={<ConceptDetail />} />
            <Route path={ROUTES.positions} element={<Positions />} />
            <Route path={ROUTE_PATTERNS.position} element={<PositionDetail />} />
            <Route path={ROUTE_PATTERNS.transition} element={<TransitionDetail />} />
            <Route path={ROUTES.blueBelt} element={<BlueBelt />} />
            <Route path={ROUTES.review} element={<Review />} />
            <Route path={ROUTES.videos} element={<Videos />} />
            <Route path={ROUTES.backup} element={<Backup />} />
            <Route path={ROUTE_PATTERNS.edit} element={<EditorPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <footer className="footer">
        Everything is stored on this device only. Export a backup from the Backup page.
      </footer>
    </div>
  );
}
