import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeServices } from './lib/services/service-registry';

// Initialize services before rendering the app
initializeServices();

createRoot(document.getElementById('root')!).render(<App />);
