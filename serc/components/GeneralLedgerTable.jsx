import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import _ from 'lodash';

const GeneralLedgerTable = () => {
  const [data, setData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [months, setMonths] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  // Process the Excel file data
  const processExcelFile = (file) => {
    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          cellStyles: true,
          cellFormulas: true,
          cellDates: true,
          cellNF: true,
          sheetStubs: true
        });
        
        // Assume first sheet contains the general ledger data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON for easier processing
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });
        
        setData(jsonData);
        
        // Process the data to create the summary table
        processSummaryData(jsonData);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error processing Excel file:', err);
        setError('Failed to process the Excel file. Please make sure it is a valid QuickBooks General Ledger export.');
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
      setIsLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  // Process the data to create account/month summary
  const processSummaryData = (jsonData) => {
    // Identify the key columns - this may need adjustment based on actual QBO export format
    // Common columns in QBO General Ledger: Date, Transaction Type, Num, Name, Memo/Description, Account, Debit, Credit, Split
    
    // Extract all unique accounts
    const allAccounts = _.uniq(jsonData.map(row => row.Account || row.account)).filter(Boolean).sort();
    setAccounts(allAccounts);
    
    // Extract all dates and convert to month-year format
    const dateField = 'Date' in jsonData[0] ? 'Date' : 'date';
    const allDates = jsonData
      .map(row => {
        // Handle different date formats
        let dateValue = row[dateField];
        if (!dateValue) return null;
        
        // If it's already a Date object
        if (dateValue instanceof Date) return dateValue;
        
        // Try to parse the date string
        try {
          // For format MM/DD/YYYY
          if (typeof dateValue === 'string' && dateValue.includes('/')) {
            const parts = dateValue.split('/');
            return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
          
          // For Excel serial number
          if (typeof dateValue === 'number') {
            return XLSX.SSF.parse_date_code(dateValue);
          }
          
          // Default parsing
          return new Date(dateValue);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    
    // Extract unique months in chronological order
    const uniqueMonths = [];
    allDates.forEach(date => {
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!uniqueMonths.includes(monthYear)) {
        uniqueMonths.push(monthYear);
      }
    });
    
    // Sort months chronologically
    const sortedMonths = uniqueMonths.sort((a, b) => {
      const [aMonth, aYear] = a.split('/').map(Number);
      const [bMonth, bYear] = b.split('/').map(Number);
      
      if (aYear !== bYear) return aYear - bYear;
      return aMonth - bMonth;
    });
    
    setMonths(sortedMonths);
    
    // Create summary data - account by month
    const summary = {};
    
    allAccounts.forEach(account => {
      summary[account] = {};
      sortedMonths.forEach(month => {
        summary[account][month] = 0;
      });
    });
    
    // Populate the summary with transaction amounts
    jsonData.forEach(row => {
      const account = row.Account || row.account;
      if (!account || !allAccounts.includes(account)) return;
      
      const dateValue = row[dateField];
      if (!dateValue) return;
      
      let transactionDate;
      try {
        if (dateValue instanceof Date) {
          transactionDate = dateValue;
        } else if (typeof dateValue === 'string' && dateValue.includes('/')) {
          const parts = dateValue.split('/');
          transactionDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else if (typeof dateValue === 'number') {
          transactionDate = XLSX.SSF.parse_date_code(dateValue);
        } else {
          transactionDate = new Date(dateValue);
        }
      } catch {
        return;
      }
      
      const monthYear = `${transactionDate.getMonth() + 1}/${transactionDate.getFullYear()}`;
      if (!sortedMonths.includes(monthYear)) return;
      
      // Calculate amount (debit - credit)
      let amount = 0;
      
      // Handle different column names for debit/credit
      const debitField = row.Debit !== undefined ? 'Debit' : 'debit';
      const creditField = row.Credit !== undefined ? 'Credit' : 'credit';
      
      const debit = parseFloat(row[debitField]) || 0;
      const credit = parseFloat(row[creditField]) || 0;
      
      // Calculate net amount based on debit - credit
      amount = debit - credit;
      
      // Add to the summary
      summary[account][monthYear] += amount;
    });
    
    setSummaryData(summary);
  };
  
  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      processExcelFile(file);
    }
  };
  
  // Calculate column totals
  const calculateColumnTotals = () => {
    const totals = {};
    
    months.forEach(month => {
      let total = 0;
      accounts.forEach(account => {
        total += summaryData[account][month] || 0;
      });
      totals[month] = total;
    });
    
    return totals;
  };
  
  // Calculate row totals
  const calculateRowTotals = () => {
    const totals = {};
    
    accounts.forEach(account => {
      let total = 0;
      months.forEach(month => {
        total += summaryData[account][month] || 0;
      });
      totals[account] = total;
    });
    
    return totals;
  };
  
  // Format date for display (Jan 2023)
  const formatMonth = (monthYear) => {
    const [month, year] = monthYear.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Handle print button click
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <div className="mb-8 print:hidden">
        <h1 className="text-2xl font-bold mb-4">QuickBooks General Ledger Monthly Summary</h1>
        
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Upload QuickBooks General Ledger Excel File:
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="block w-full text-gray-500 bg-gray-100 border border-gray-300 rounded p-2"
          />
          {fileName && <p className="mt-2 text-sm text-gray-600">File: {fileName}</p>}
        </div>
        
        {isLoading && <p className="text-blue-500">Processing file, please wait...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {data && (
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Print Report
          </button>
        )}
      </div>
      
      {data && accounts.length > 0 && months.length > 0 && (
        <div className="overflow-x-auto">
          <div className="print:text-sm">
            <h2 className="text-xl font-bold mb-4 print:text-2xl">General Ledger Monthly Summary</h2>
            {fileName && <p className="mb-4">Source: {fileName}</p>}
            
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Account</th>
                  {months.map(month => (
                    <th key={month} className="border border-gray-300 p-2 text-right">
                      {formatMonth(month)}
                    </th>
                  ))}
                  <th className="border border-gray-300 p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => {
                  const rowTotals = calculateRowTotals();
                  return (
                    <tr key={account} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 font-medium">{account}</td>
                      {months.map(month => (
                        <td key={`${account}-${month}`} className="border border-gray-300 p-2 text-right">
                          {formatCurrency(summaryData[account][month] || 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right font-medium">
                        {formatCurrency(rowTotals[account] || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 p-2">Total</td>
                  {months.map(month => {
                    const columnTotals = calculateColumnTotals();
                    return (
                      <td key={`total-${month}`} className="border border-gray-300 p-2 text-right">
                        {formatCurrency(columnTotals[month] || 0)}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(
                      Object.values(calculateRowTotals()).reduce((sum, value) => sum + value, 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <style jsx>{`
            @media print {
              body { margin: 0.5in; }
              button { display: none; }
              input { display: none; }
              .print\\:hidden { display: none; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default GeneralLedgerTable;
