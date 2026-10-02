import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Roboto, self-host edilmiş değişken font olarak yüklenir.
// font-family adı: "Roboto Variable" (bkz. styles/index.css -> --font-sans)
import '@fontsource-variable/roboto';
import './styles/index.css';

import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const container = document.getElementById('root');

if (container === null) {
  // Sessizce boş ekranla devam etmek yerine nedeni açıkça bildiriyoruz.
  throw new Error('#root öğesi bulunamadı. frontend/index.html içeriğini kontrol edin.');
}

createRoot(container).render(
  <StrictMode>
    {/*
      Sınır, `AuthProvider` ve `BrowserRouter` DIŞINDA ve EN DIŞTA durur:
      hem oturum hem gezinme sağlayıcılarının kendisi bir hata verirse
      (ör. bozuk kalıcı oturum) ekran yine kurtarılabilir. Sınırın içine
      konmayan bir sağlayıcı, hatasında beyaz ekranı geri getirirdi.
    */}
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
