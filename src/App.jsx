import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useRoutes,
} from "react-router-dom";
import routes from "tempo-routes";

// Create a component that uses the useRoutes hook
function TempoRoutes() {
  return import.meta.env.VITE_TEMPO ? useRoutes(routes) : null;
}
import GeneralLedgerTable from "./components/GeneralLedgerTable";

// Initialize Tempo Devtools
import { TempoDevtools } from "tempo-devtools";
TempoDevtools.init();

function App() {
  return (
    <Router>
      <div className="bg-gray-100 min-h-screen bg-glow-light">
        <header className="bg-white shadow-glow">
          <div className="max-w-6xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-glow-gradient">
              QuickBooks GL Monthly Summary
            </h1>
          </div>
        </header>

        <main className="py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-glow p-8 border border-gray-100 glow-card">
              {/* For Tempo routes */}
              <TempoRoutes />

              <Routes>
                <Route path="/" element={<GeneralLedgerTable />} />
                {/* Add this before any catchall route */}
                {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}
              </Routes>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 print:hidden mt-8 shadow-glow-sm">
          <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-glow-text-light text-center">
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
