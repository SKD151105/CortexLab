import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { queryClient } from "./lib/queryClient.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
