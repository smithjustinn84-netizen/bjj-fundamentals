import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../routes';

/** The switch at the top of every page behind the Learn tab. Techniques are reached from positions. */
export function LearnTabs() {
  const { pathname } = useLocation();
  return (
    <nav className="segmented learn-tabs" aria-label="Learn">
      <NavLink to={ROUTES.concepts}>Concepts</NavLink>
      <NavLink
        to={ROUTES.positions}
        className={({ isActive }) => (isActive || pathname.startsWith(ROUTES.transitions) ? 'active' : '')}
      >
        Positions
      </NavLink>
      <NavLink to={ROUTES.blueBelt}>Blue belt</NavLink>
    </nav>
  );
}
