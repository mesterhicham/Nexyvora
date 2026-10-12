import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { registerServiceWorker } from "./serviceWorkerRegistration";

createRoot(document.getElementById("root")!).render(<App />);

// Initialize PWA Service Worker
registerServiceWorker();

