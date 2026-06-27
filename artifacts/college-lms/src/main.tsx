import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-calendar/dist/Calendar.css";

createRoot(document.getElementById("root")!).render(<App />);
