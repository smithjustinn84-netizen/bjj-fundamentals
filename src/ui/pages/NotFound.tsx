import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';

export default function NotFound() {
  return (
    <div className="card">
      <h1>Page not found</h1>
      <Link to={ROUTES.home}>← Home</Link>
    </div>
  );
}
