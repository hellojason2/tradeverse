import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/reference.css';

if (import.meta.env.DEV && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Unregister any non-MSW service worker left over from prior sessions.
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      const url = reg.active?.scriptURL ?? '';
      if (!url.includes('mockServiceWorker')) reg.unregister();
    });
  });
}

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true,
    });
  }

  createRoot(document.getElementById('root')!).render(<App />);
}

bootstrap();
