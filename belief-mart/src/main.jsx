import React from "react";
import { createRoot } from "react-dom/client";
import { installStorageShim } from "./storage-shim.js";
import BeliefMart from "./BeliefMart.jsx";

installStorageShim(); // must run before the component's first effect

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BeliefMart />
  </React.StrictMode>
);
