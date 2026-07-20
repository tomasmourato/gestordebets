import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import type { InitialAppData } from "./initialData";

export function renderApp(initialData: InitialAppData): string {
  return renderToString(<App initialData={initialData} />);
}

