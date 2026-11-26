import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Faultline } from "./faultline";

// Initialize Faultline SDK
Faultline.init({
  dsn: import.meta.env.VITE_FAULTLINE_URL || "http://localhost:8000",
  apiKey: import.meta.env.VITE_FAULTLINE_KEY || "fl_demo_key_9f8e7d6c5b4a",
  release: import.meta.env.VITE_APP_RELEASE || "1.4.1",
  environment: import.meta.env.VITE_APP_ENV || "production",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

