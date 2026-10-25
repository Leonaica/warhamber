import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// GitHub Pages 404 fallback passes the intended path as ?p=
const redirected = new URLSearchParams(location.search).get('p');
if (redirected) {
  history.replaceState(null, '', import.meta.env.BASE_URL + redirected.replace(/^\//, ''));
}

 createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)