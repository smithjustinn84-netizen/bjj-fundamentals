import type { MouseEvent } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
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
import More from './ui/pages/More';
import NotFound from './ui/pages/NotFound';
import PositionDetail from './ui/pages/PositionDetail';
import Positions from './ui/pages/Positions';
import Review from './ui/pages/Review';
import TrainingLog from './ui/pages/TrainingLog';
import TransitionDetail from './ui/pages/TransitionDetail';
import Videos from './ui/pages/Videos';
import { LEARN_ROUTES, MORE_ROUTES, ROUTE_PATTERNS, ROUTES } from './ui/routes';
import { useAppliedTheme } from './ui/theme';

const MAIN_ID = 'main';

/** The app uses hash routing, so a plain `#main` link would navigate. Move focus by hand instead. */
function focusMain(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  document.getElementById(MAIN_ID)?.focus();
}

/** True on any of these pages or a page beneath one, so a tab stays lit on the pages it leads to. */
function isUnder(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
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
  useAppliedTheme();
  return (
    <div className="app">
      <a className="skip-link" href={`#${MAIN_ID}`} onClick={focusMain}>
        Skip to content
      </a>
      <header className="topbar">
        <NavLink to={ROUTES.home} className="brand" end>
          <BrandMark />
          <span className="brand-name">BJJ Fundamentals</span>
        </NavLink>
        <nav className="nav" aria-label="Main">
          <NavLink to={ROUTES.home} end>
            <Icon name="home" />
            Today
          </NavLink>
          {/* Concepts, positions, techniques and the belt test are one tab; the switch on each page moves between them. */}
          <NavLink to={ROUTES.concepts} className={() => (isUnder(pathname, LEARN_ROUTES) ? 'active' : '')}>
            <Icon name="concepts" />
            Learn
          </NavLink>
          <ErrorBoundary>
            <ReviewNavLink />
          </ErrorBoundary>
          <NavLink to={ROUTES.log}>
            <Icon name="log" />
            Log
          </NavLink>
          <NavLink to={ROUTES.more} className={() => (isUnder(pathname, MORE_ROUTES) ? 'active' : '')}>
            <Icon name="more" />
            More
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
            <Route path={ROUTES.log} element={<TrainingLog />} />
            <Route path={ROUTES.videos} element={<Videos />} />
            <Route path={ROUTES.backup} element={<Backup />} />
            <Route path={ROUTES.more} element={<More />} />
            <Route path={ROUTE_PATTERNS.edit} element={<EditorPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <footer className="footer">
        Everything is stored on this device only. <Link to={ROUTES.backup}>Export a backup</Link> now and then.
      </footer>
    </div>
  );
}
