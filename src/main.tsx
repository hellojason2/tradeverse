import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

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
