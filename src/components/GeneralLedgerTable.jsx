import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import _ from "lodash";
// html-to-image import removed
import ExcludedAccountsTable from "./ExcludedAccountsTable";
import GLTable from "./tables/GLTable";
import ColumnMappingForm from "./ColumnMappingForm";
import { findDateField, findAmountField } from "../utils/columnMapping";
import {
  parseDate,
  formatMonthYear,
  formatMonthYearForDisplay,
} from "../utils/dateParsing";

const GeneralLedgerTable = () => {
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
  const [customAccountField, setCustomAccountField] = useState("");
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
          const fields = Object.keys(jsonData[4] || {});
          setAvailableFields(fields);
          console.log("Available fields:", fields);
        }

        setData(jsonData);
        setOriginalData(jsonData);

        // Process the data to create the summary table
        processSummaryData(jsonData);
        setIsLoading(false);
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

    // Determine which account field to use - either custom or auto-detected
    let accountField = customAccountField;

    // If no custom field is specified, auto-detect
    if (!accountField) {
      accountField = "Split"; // Default to Split

      // Try common variations of the account field name
      const possibleAccountFields = [
        "Split",
        "split",
        "SPLIT",
        "Account",
        "account",
        "ACCOUNT",
        "Distribution account",
      ];

      for (const field of possibleAccountFields) {
        if (processedData[0] && field in processedData[0]) {
          accountField = field;
          break;
        }
      }
    }

    console.log("Account field found:", accountField);

    // If we have excluded accounts, filter the data
    if (excludedAccounts.length > 0) {
      // Filter out transactions from excluded accounts
      processedData = processedData.filter((row) => {
        const account =
          row[accountField] ||
          row.Split ||
          row.split ||
          row.SPLIT ||
          row["Split"] ||
          row["SPLIT"];
        return !excludedAccounts.includes(account);
      });
    }

    // Extract all unique accounts from the filtered data using the determined account field
    const allAccounts = _.uniq(
      processedData.map((row) => {
        // Use the determined account field or fall back to checking various possible column names
        return (
          row[accountField] ||
          row.Split ||
          row.split ||
          row.SPLIT ||
          row["Split"] ||
          row["SPLIT"]
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
      dateField = findDateField(processedData[1], true);
    }

    console.log("Date field found:", dateField);

    if (!dateField) {
      console.error("No date field found in the data");
      // Log more details about the data structure to help diagnose the issue
      console.log("Data structure sample:", processedData.slice(0, 3));
      console.log("Available columns:", Object.keys(processedData[0] || {}));

      setError(
        "No date information found in the data. Please check the file format or try a different file.",
        <button
          onClick={loadSampleData}
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-5 rounded-lg mr-4 shadow-sm transition duration-200"
        >
          Load Sample Data
        </button>,
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
      amountField = findAmountField(processedData[1], true);
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
        row[accountField] ||
        row.Split ||
        row.split ||
        row.SPLIT ||
        row["Split"] ||
        row["SPLIT"];
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

  // These functions have been moved to utils/columnMapping.js

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
      amountField = findAmountField(jsonData[1]);
    }

    if (!amountField) {
      console.error("No amount field found for excluded accounts calculation");
      return;
    }

    console.log("Calculating totals for excluded accounts:", excludedAccounts);

    // Determine which account field to use - either custom or auto-detected
    let accountField = customAccountField;

    // If no custom field is specified, auto-detect
    if (!accountField) {
      accountField = "Split"; // Default to Split

      // Try common variations of the account field name
      const possibleAccountFields = [
        "Split",
        "split",
        "SPLIT",
        "Account",
        "account",
        "ACCOUNT",
      ];

      for (const field of possibleAccountFields) {
        if (jsonData[0] && field in jsonData[0]) {
          accountField = field;
          break;
        }
      }
    }

    // Process only the excluded accounts from the data
    jsonData.forEach((row) => {
      const account =
        row[accountField] ||
        row.Split ||
        row.split ||
        row.SPLIT ||
        row["Split"] ||
        row["SPLIT"];

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

  // Handle process button click
  const handleProcessFile = () => {
    // Get the file input element
    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];

    if (file) {
      processExcelFile(file);
    } else {
      setError("Please select a file first.");
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

  // Table reference for export functionality
  const tableRef = useRef(null);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // PNG export functionality has been removed

  // Handle account exclusion by clicking on a row
  const excludeAccount = (account) => {
    if (!excludedAccounts.includes(account)) {
      console.log(`Excluding account: ${account}`);
      setExcludedAccounts((prev) => [...prev, account]);
      // The useEffect will handle reprocessing the data
    }
  };

  // Handle restoring an account from the excluded accounts table
  const restoreAccount = (account) => {
    setExcludedAccounts((prev) => prev.filter((a) => a !== account));
    // No need to call processSummaryData here as the useEffect will handle it
  };

  // Apply filters and recalculate summary
  const applyFilters = () => {
    if (originalData) {
      // Process the original data with the current excluded accounts
      processSummaryData(originalData);
    }
  };

  // Effect to reprocess data when excluded accounts or custom fields change
  useEffect(() => {
    if (originalData) {
      processSummaryData(originalData);
    }
  }, [
    excludedAccounts,
    customDateField,
    customAmountField,
    customAccountField,
  ]);

  // Add a sample data for testing if needed
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
  };

  return (
    <div>
      <div className="container print-hide">
        <form className="form-horizontal">
          <div className="class=form-group">
            <div className="col-4 col-sm-12">
              <label className="form-label">
                QuickBooks General Ledger File (.xlsx):&nbsp;
              </label>
            </div>
            <div className="col-4 col-sm-12">
              <input
                id="file-input"
                className="form-input btn"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </form>
        <div className="col-4 col-sm-12">
          {fileName && (
            <p className="label label-secondary">File: {fileName}</p>
          )}
        </div>
        <div className="col-3 col-sm-12">
          {/* Column mapping options */}
          {availableFields.length > 0 && (
            <ColumnMappingForm
              availableFields={availableFields}
              customDateField={customDateField}
              customAmountField={customAmountField}
              customAccountField={customAccountField}
              setCustomDateField={setCustomDateField}
              setCustomAmountField={setCustomAmountField}
              setCustomAccountField={setCustomAccountField}
            />
          )}
        </div>
        <div className="columns">
          <div className="col-3">
            <button
              className="btn"
              onClick={handleProcessFile}
              disabled={!fileName || isLoading}
            >
              Process File
            </button>
          </div>
        </div>
        {isLoading && <p className="">Processing file, please wait...</p>}
        {error && <p className="">{error}</p>}
      </div>

      {data && accounts.length > 0 && months.length > 0 && (
        <div className="overflow-x-auto">
          {/* PNG export button removed */}

          <GLTable
            accounts={accounts}
            months={months}
            summaryData={summaryData}
            calculateRowTotals={calculateRowTotals}
            calculateColumnTotals={calculateColumnTotals}
            excludeAccount={excludeAccount}
            formatCurrency={formatCurrency}
            tableRef={tableRef}
          />

          {excludedAccounts.length > 0 && (
            <div className="p-2 text-small">
              <p>
                <span className="label label-warning">Note:</span>{" "}
                {excludedAccounts.length} account(s) excluded from summary.
                Click on any account row to exclude it from the summary.
              </p>
            </div>
          )}

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

export default GeneralLedgerTable;
