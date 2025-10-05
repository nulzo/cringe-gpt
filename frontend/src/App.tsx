import "./index.css";
import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { CommandPalette } from "@/features/command-palette";

function App() {
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const navigate = useNavigate();

  const handleSetActiveView = (path: string) => {
    navigate(path);
  };

  // The main layout is handled by the router configuration.
  // App.tsx just needs to render the matched child route.
  return (
    <>
      {/* CommandPalette is rendered globally in UIStateProvider */}
      <Outlet />
    </>
  );
}

export default App;
