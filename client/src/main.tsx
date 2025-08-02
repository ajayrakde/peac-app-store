import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global unhandled rejection handler for debugging
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise:', event.promise);
  console.trace('Stack trace:');
  // Prevent the default behavior
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
