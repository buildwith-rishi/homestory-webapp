import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installNoStoreFetch } from './utils/installNoStoreFetch';
import { resetSessionExpiredGuard } from './auth/sessionExpired';

installNoStoreFetch();
resetSessionExpiredGuard();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
