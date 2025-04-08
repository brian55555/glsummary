import React from 'react';
import GeneralLedgerTable from './components/GeneralLedgerTable';

function App() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-800">
            QuickBooks General Ledger Monthly Summary
          </h1>
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-6">
              <GeneralLedgerTable />
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} QuickBooks GL Monthly Summary Tool
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
