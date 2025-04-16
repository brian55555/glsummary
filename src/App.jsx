import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import GeneralLedgerTable from "./components/GeneralLedgerTable";

// Create a separate component for Tempo routes
function TempoRoutes() {
  return useRoutes(routes);
}

function App() {
  return (
    <Router>
      <div>
        <header>
          <div className="print-hide">
            <div className="">
              <h1 className="text-center">QuickBooks GL Monthly Summary</h1>
            </div>
          </div>
        </header>

        <main>
          <div className="main">
            <div className="">
              {/* For the tempo routes - now properly inside Router context */}
              {import.meta.env.VITE_TEMPO && <TempoRoutes />}
              <Routes>
                <Route path="/" element={<GeneralLedgerTable />} />
                {/* Add this before any catchall route */}
                {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}
              </Routes>
            </div>
          </div>
          <div className="spacer"></div>
        </main>

        <footer className="print-hide">
          <div className="">
            <p className="text-sm text-center">
              &copy; {new Date().getFullYear()} QuickBooks GL Monthly Summary
              Tool
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
