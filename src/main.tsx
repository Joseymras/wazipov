import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply stored theme before paint to prevent flash
const stored = localStorage.getItem("pov-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (stored === "dark" || (!stored && prefersDark)) document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
