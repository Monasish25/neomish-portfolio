import React from "react";
import { ProjectsProvider } from "./ProjectsContext";
import Portfolio from "./Portfolio";

export default function App() {
  return (
    <ProjectsProvider>
      <Portfolio />
    </ProjectsProvider>
  );
}
