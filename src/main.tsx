import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppStyles } from './styles/globals/App';
import { GlobalStyles } from './styles/globals/Global';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GlobalStyles />
        <AppStyles />
        <App />
    </StrictMode>,
);
