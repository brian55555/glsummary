import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import _ from "lodash";
import ExcludedAccountsTable from "./ExcludedAccountsTable";
import { findDateField, findAmountField } from "../utils/columnMapping";
import {
  parseDate,
  formatMonthYear,
  formatMonthYearForDisplay,
} from "../utils/dateParsing";

const GeneralLedgerWorkflow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [months, setMonths] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [excludedAccounts, setExcludedAccounts] = useState([]);
  const [originalData, setOriginalData] = useState(null);
  const [excludedAccountTotals, setExcludedAccountTotals] = useState({});
  const [customDateField, setCustomDateField] = useState("");
  const [customAmountField, setCustomAmountField] = useState("");
  const [availableFields, setAvailableFields] = useState([]);

  // Process the Excel file data
  const processExcelFile = (file) => {
    setIsLoading(true);
    setError(null);
    console.log("Processing Excel file:", file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          cellStyles: true,
          cellFormulas: true,
          cellDates: true,
          cellNF: true,
          sheetStubs: true,
        });

        console.log(
          "Excel file read successfully. Sheets:",
          workbook.SheetNames,
        );

        // Assume first sheet contains the general ledger data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Always use row 5 (0-based index 4) for headers
        let jsonData = [];
        const headerRow = 4; // Always use row 5 (0-based index 4)

        console.log(`Using row 5 for headers (0-based index ${headerRow})`);
        jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: "yyyy-mm-dd",
          range: headerRow, // 0-based index 4 = row 5
        });

        if (!jsonData || jsonData.length === 0) {
          console.error("No data found in the Excel file");
          setError(
            "No data found in the Excel file or the format is not recognized.",
          );
          setIsLoading(false);
          return;
        }

        console.log("JSON Data sample:", jsonData[0]);
        console.log("Total rows:", jsonData.length);

        // Extract available fields for the column selector
        if (jsonData && jsonData.length > 0) {
          const fields = Object.keys(jsonData[0] || {});
          setAvailableFields(fields);
          console.log("Available fields:", fields);
        }

        setData(jsonData);
        setOriginalData(jsonData);

        // Process the data to create the summary table
        processSummaryData(jsonData);
        setIsLoading(false);

        // Move to next step
        setCurrentStep(2);
      } catch (err) {
        console.error("Error processing Excel file:", err);
        setError(
          "Failed to process the Excel file. Please make sure it is a valid QuickBooks General Ledger export.",
        );
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Process the data to create account/month summary
  const processSummaryData = (jsonData) => {
    if (!jsonData || jsonData.length === 0) {
      console.error("No data to process in processSummaryData");
      return;
    }

    // Create a copy of the data for processing
    let processedData = [...jsonData];

    // Debug log to check the data structure
    console.log("Processing data:", processedData[0]);

    // If we have excluded accounts, filter the data
    if (excludedAccounts.length > 0) {
      // Filter out transactions from excluded accounts
      processedData = processedData.filter((row) => {
        const account =
          row.Split || row.split || row.SPLIT || row["Split"] || row["SPLIT"];
        return !excludedAccounts.includes(account);
      });
    }

    // Extract all unique accounts from the filtered data
    const allAccounts = _.uniq(
      processedData.map((row) => {
        // Check for various possible column names for the Split field
        return (
          row.Split || row.split || row.SPLIT || row["Split"] || row["SPLIT"]
        );
      }),
    )
      .filter(Boolean)
      .sort();

    console.log("Extracted accounts:", allAccounts);

    if (allAccounts.length === 0) {
      console.error("No accounts found in the data");
      setError(
        "No account information found in the data. Please check the file format.",
      );
      return;
    }

    setAccounts(allAccounts);

    // Extract all dates and convert to month-year format
    // First, determine which date field to use - either custom or auto-detected
    let dateField = customDateField;

    // If no custom field is specified, auto-detect
    if (!dateField) {
      dateField = findDateField(processedData[0], true);
    }

    console.log("Date field found:", dateField);

    if (!dateField) {
      console.error("No date field found in the data");
      // Log more details about the data structure to help diagnose the issue
      console.log("Data structure sample:", processedData.slice(0, 3));
      console.log("Available columns:", Object.keys(processedData[0] || {}));

      setError(
        "No date information found in the data. Please check the file format or try a different file.",
      );
      return;
    }

    const allDates = processedData
      .map((row) => {
        // Use the new parseDate utility function
        return parseDate(row[dateField], true);
      })
      .filter(Boolean);

    console.log("Extracted dates:", allDates);

    if (allDates.length === 0) {
      console.error("No valid dates found in the data");
      setError(
        "No valid date information found in the data. Please check the file format.",
      );
      return;
    }

    // Extract unique months in chronological order
    const uniqueMonths = [];
    allDates.forEach((date) => {
      const monthYear = formatMonthYear(date);
      if (!uniqueMonths.includes(monthYear)) {
        uniqueMonths.push(monthYear);
      }
    });

    // Sort months chronologically
    const sortedMonths = uniqueMonths.sort((a, b) => {
      const [aMonth, aYear] = a.split("/").map(Number);
      const [bMonth, bYear] = b.split("/").map(Number);

      if (aYear !== bYear) return aYear - bYear;
      return aMonth - bMonth;
    });

    console.log("Sorted months:", sortedMonths);
    setMonths(sortedMonths);

    // Create summary data - account by month
    const summary = {};

    allAccounts.forEach((account) => {
      summary[account] = {};
      sortedMonths.forEach((month) => {
        summary[account][month] = 0;
      });
    });

    // Find the amount field - either custom or auto-detected
    let amountField = customAmountField;

    // If no custom field is specified, auto-detect
    if (!amountField) {
      amountField = findAmountField(processedData[0], true);
    }

    console.log("Amount field found:", amountField);

    if (!amountField) {
      console.error("No amount field found in the data");
      // Log more details about the data structure to help diagnose the issue
      console.log("Data structure sample:", processedData.slice(0, 3));
      console.log("Available columns:", Object.keys(processedData[0] || {}));

      setError(
        "No amount information found in the data. Please check the file format or try a different file.",
      );
      return;
    }

    // Populate the summary with transaction amounts
    processedData.forEach((row) => {
      const account =
        row.Split || row.split || row.SPLIT || row["Split"] || row["SPLIT"];
      if (!account || !allAccounts.includes(account)) return;

      const dateValue = row[dateField];
      if (!dateValue) return;

      // Use the parseDate utility function
      const transactionDate = parseDate(dateValue, false);
      if (!transactionDate) {
        console.error("Failed to parse transaction date:", dateValue);
        return;
      }

      const monthYear = formatMonthYear(transactionDate);
      if (!sortedMonths.includes(monthYear)) return;

      // Clean the amount value by removing $ and commas before parsing
      let amountValue = row[amountField];
      if (typeof amountValue === "string") {
        amountValue = amountValue.replace(/[$,]/g, "");
      }

      const amount = parseFloat(amountValue) || 0;

      // Add to the summary
      summary[account][monthYear] += amount;
    });

    console.log("Final summary data:", summary);
    setSummaryData(summary);

    // Calculate totals for excluded accounts
    calculateExcludedAccountTotals(jsonData);
  };

  // Calculate totals for excluded accounts
  const calculateExcludedAccountTotals = (jsonData) => {
    if (!jsonData || excludedAccounts.length === 0) {
      console.log("No data or excluded accounts to calculate totals for");
      setExcludedAccountTotals({});
      return;
    }

    const totals = {};

    // Initialize totals for all excluded accounts
    excludedAccounts.forEach((account) => {
      totals[account] = 0;
    });

    // Find the amount field - either custom or auto-detected
    let amountField = customAmountField;

    // If no custom field is specified, auto-detect
    if (!amountField) {
      amountField = findAmountField(jsonData[0]);
    }

    if (!amountField) {
      console.error("No amount field found for excluded accounts calculation");
      return;
    }

    console.log("Calculating totals for excluded accounts:", excludedAccounts);

    // Process only the excluded accounts from the data
    jsonData.forEach((row) => {
      const account =
        row.Split || row.split || row.SPLIT || row["Split"] || row["SPLIT"];

      if (!account || !excludedAccounts.includes(account)) return;

      // Clean the amount value by removing $ and commas before parsing
      let amountValue = row[amountField];
      if (typeof amountValue === "string") {
        amountValue = amountValue.replace(/[$,]/g, "");
      }

      const amount = parseFloat(amountValue) || 0;
      totals[account] += amount;
      console.log(
        `Added ${amount} to ${account}, new total: ${totals[account]}`,
      );
    });

    console.log("Final excluded account totals:", totals);
    setExcludedAccountTotals(totals);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("File selected:", file.name);
      setFileName(file.name);
      // Process the file immediately for better user experience
      processExcelFile(file);
    }
  };

  // Calculate column totals
  const calculateColumnTotals = () => {
    const totals = {};

    months.forEach((month) => {
      let total = 0;
      accounts.forEach((account) => {
        // Ensure we're adding a number value
        const value = summaryData[account]?.[month] || 0;
        total += parseFloat(value);
      });
      totals[month] = total;
    });
    return totals;
  };

  // Calculate row totals
  const calculateRowTotals = () => {
    const totals = {};

    accounts.forEach((account) => {
      let total = 0;
      months.forEach((month) => {
        if (summaryData[account] && month in summaryData[account]) {
          total += summaryData[account][month] || 0;
        }
      });
      totals[account] = total;
    });

    return totals;
  };

  // Format date for display (Jan 2023) - now using utility function
  const formatMonth = formatMonthYearForDisplay;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Handle print button click
  const handlePrint = () => {
    window.print();
  };

  // Handle account exclusion by clicking on a row
  const excludeAccount = (account) => {
    if (!excludedAccounts.includes(account)) {
      setExcludedAccounts((prev) => [...prev, account]);
    }
  };

  // Handle restoring an account from the excluded accounts table
  const restoreAccount = (account) => {
    setExcludedAccounts((prev) => prev.filter((a) => a !== account));
  };

  // Apply filters and recalculate summary
  const applyFilters = () => {
    if (originalData) {
      // Process the original data with the current excluded accounts
      processSummaryData(originalData);

      // Move to the results step
      setCurrentStep(3);
    }
  };

  // Load sample data for testing
  const loadSampleData = () => {
    const sampleData = [
      {
        Date: "01/15/2023",
        Split: "Account 1",
        Amount: "1000",
      },
      {
        Date: "01/20/2023",
        Split: "Account 2",
        Amount: "2000",
      },
      {
        Date: "02/10/2023",
        Split: "Account 1",
        Amount: "1500",
      },
      {
        Date: "02/15/2023",
        Split: "Account 3",
        Amount: "3000",
      },
      {
        Date: "03/05/2023",
        Split: "Account 2",
        Amount: "1200",
      },
      {
        Date: "03/15/2023",
        Split: "Account 4",
        Amount: "2500",
      },
    ];
    console.log("Loading sample data", sampleData);
    setData(sampleData);
    setOriginalData(sampleData);
    setFileName("sample-data.xlsx");
    processSummaryData(sampleData);
    setCurrentStep(2);
  };

  // Effect to reprocess data when excluded accounts or custom fields change
  useEffect(() => {
    if (originalData) {
      processSummaryData(originalData);
    }
  }, [excludedAccounts, customDateField, customAmountField]);

  // Proceed to next step
  const goToNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  // Go back to previous step
  const goToPreviousStep = () => {
    setCurrentStep((prevStep) => Math.max(1, prevStep - 1));
  };

  return (
    <div className="workflow-container">
      {/* Step Progress Indicator */}
      <div className="mb-8 print:hidden">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                  currentStep >= step ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                {step}
              </div>
              <div className="mt-2 text-sm font-medium text-gray-600">
                {step === 1 && "Upload"}
                {step === 2 && "Configure"}
                {step === 3 && "Results"}
              </div>
            </div>
          ))}
        </div>
        <div className="relative flex items-center justify-between mt-3">
          <div className="absolute left-0 top-1/2 h-1 w-full bg-gray-200 -z-10"></div>
          <div
            className="absolute left-0 top-1/2 h-1 bg-blue-600 -z-5 transition-all duration-300"
            style={{ width: `${(currentStep - 1) * 50}%` }}
          ></div>
        </div>
      </div>

      {/* Step 1: Upload File */}
      {currentStep === 1 && (
        <div className="step-upload mb-10 print:hidden">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            Step 1: Upload Your QuickBooks General Ledger Data
          </h2>

          <div className="mb-6">
            <label className="block mb-2 font-medium">
              QuickBooks General Ledger Excel File:
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition duration-200">
              <input
                id="file-input"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-md font-medium text-blue-600 mb-1">
                  Click to browse files
                </span>
                <span className="text-sm text-gray-500">
                  or drag and drop your file here
                </span>
                <span className="mt-2 text-xs text-gray-400">
                  Accepts .xlsx or .xls files
                </span>
              </label>
            </div>
            {fileName && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm text-gray-700">
                  Selected file: <span className="font-medium">{fileName}</span>
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={loadSampleData}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition duration-200"
            >
              Load Sample Data
            </button>
          </div>

          {isLoading && (
            <div className="mt-6 flex items-center text-blue-500">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Processing file, please wait...</span>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-500 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Configure Settings */}
      {currentStep === 2 && (
        <div className="step-configure mb-10 print:hidden">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            Step 2: Configure Your Report Settings
          </h2>

          {/* Column mapping options */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-gray-700">
              Column Mapping
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                The application will try to automatically detect the correct
                columns from your data. If needed, you can manually specify them
                below.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Date Column:
                  </label>
                  <select
                    value={customDateField}
                    onChange={(e) => setCustomDateField(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Auto-detect (recommended)</option>
                    {availableFields.map((field) => (
                      <option key={`date-${field}`} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Amount Column:
                  </label>
                  <select
                    value={customAmountField}
                    onChange={(e) => setCustomAmountField(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Auto-detect (recommended)</option>
                    {availableFields.map((field) => (
                      <option key={`amount-${field}`} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Account Filtering (if we have data) */}
          {accounts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-700">
                Account Filtering
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  {excludedAccounts.length > 0
                    ? `${excludedAccounts.length} account(s) are currently excluded from the report.`
                    : "All accounts will be included in the report."}
                </p>

                {excludedAccounts.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm mb-2">
                      Excluded Accounts:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {excludedAccounts.map((account) => (
                        <div
                          key={account}
                          className="bg-gray-200 rounded-full px-3 py-1 text-sm flex items-center"
                        >
                          {account}
                          <button
                            onClick={() => restoreAccount(account)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-md text-sm"
                  >
                    Select Accounts to Include/Exclude
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button
              onClick={goToPreviousStep}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 px-5 rounded-lg shadow-sm transition duration-200"
            >
              Back
            </button>
            <button
              onClick={applyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition duration-200"
            >
              Generate Report
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results and Report */}
      {currentStep === 3 &&
        data &&
        accounts.length > 0 &&
        months.length > 0 && (
          <div className="step-results">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h2 className="text-xl font-semibold text-gray-700">
                Step 3: Monthly Summary Report
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={goToPreviousStep}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg shadow-sm transition duration-200"
                >
                  Back to Settings
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition duration-200 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print Report
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="print:text-sm w-full">
                <h2 className="text-2xl font-bold mb-4 print:text-2xl text-gray-800">
                  General Ledger Monthly Summary
                </h2>
                {fileName && <p className="mb-4">Source: {fileName}</p>}

                {excludedAccounts.length > 0 && (
                  <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">Note:</span>{" "}
                      {excludedAccounts.length} account(s) excluded from
                      summary. Click on any account name to exclude it from the
                      report.
                    </p>
                  </div>
                )}

                <table className="min-w-full border-collapse border border-gray-300 table-auto rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-200 text-gray-800">
                      <th className="border border-gray-300 p-3 text-left font-semibold">
                        Account
                      </th>
                      {months.map((month) => (
                        <th
                          key={month}
                          className="border border-gray-300 p-3 text-right font-semibold"
                        >
                          {formatMonth(month)}
                        </th>
                      ))}
                      <th className="border border-gray-300 p-3 text-right font-semibold">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => {
                      const rowTotals = calculateRowTotals();
                      return (
                        <tr
                          key={account}
                          className="hover:bg-gray-50 even:bg-gray-50"
                        >
                          <td
                            className="border border-gray-300 p-3 font-medium cursor-pointer hover:bg-blue-50"
                            onClick={() => excludeAccount(account)}
                            title="Click to exclude this account"
                          >
                            {account}
                          </td>
                          {months.map((month) => (
                            <td
                              key={`${account}-${month}`}
                              className="border border-gray-300 p-3 text-right"
                            >
                              {summaryData[account] &&
                              summaryData[account][month] === 0
                                ? "-"
                                : formatCurrency(
                                    summaryData[account]?.[month] || 0,
                                  )}
                            </td>
                          ))}
                          <td className="border border-gray-300 p-3 text-right font-medium bg-gray-100">
                            {formatCurrency(rowTotals[account] || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-200 font-bold text-gray-800">
                      <td className="border border-gray-300 p-3 font-bold">
                        Total
                      </td>
                      {months.map((month) => {
                        const columnTotals = calculateColumnTotals();
                        return (
                          <td
                            key={`total-${month}`}
                            className="border border-gray-300 p-3 text-right font-bold"
                          >
                            {formatCurrency(columnTotals[month] || 0)}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 p-3 text-right font-bold bg-gray-100">
                        {formatCurrency(
                          Object.values(calculateRowTotals()).reduce(
                            (sum, value) => sum + value,
                            0,
                          ),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Excluded Accounts Table */}
            <ExcludedAccountsTable
              excludedAccounts={excludedAccounts}
              onRestoreAccount={restoreAccount}
              formatCurrency={formatCurrency}
              rowTotals={excludedAccountTotals}
            />
          </div>
        )}
    </div>
  );
};

export default GeneralLedgerWorkflow;
