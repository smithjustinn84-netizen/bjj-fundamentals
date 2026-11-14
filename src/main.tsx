import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/shell.css';
import './styles/graphics.css';
import './styles/home.css';
import './styles/review.css';
import './styles/map.css';

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing the #root element.');

createRoot(root).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
