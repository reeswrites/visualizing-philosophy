import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import FreeWillMap from "./FreeWillMap.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FreeWillMap />
  </StrictMode>
);
