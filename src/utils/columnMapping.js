/**
 * Utility functions for mapping columns in Excel data
 */

/**
 * Find the date field in the data row
 * @param {Object} row - The data row to search for date field
 * @param {boolean} verbose - Whether to log verbose information
 * @returns {string|null} - The name of the date field or null if not found
 */
export const findDateField = (row, verbose = true) => {
  if (!row) {
    console.error("No row data provided to findDateField");
    return null;
  }

  if (verbose) {
    console.log("Finding date field in row with keys:", Object.keys(row));
  }

  // Expanded list of possible date field names
  const possibleDateFields = [
    "Date",
    "date",
    "DATE",
    "Trans Date",
    "Transaction Date",
    "TRANS DATE",
    "TRANSACTION DATE",
    "TransactionDate",
    "transactiondate",
    "Txn Date",
    "TXN DATE",
    "TxnDate",
    "txndate",
    "Post Date",
    "POST DATE",
    "PostDate",
    "postdate",
    "Entry Date",
    "ENTRY DATE",
    "EntryDate",
    "entrydate",
  ];

  // First try exact matches
  for (const field of possibleDateFields) {
    if (field in row) {
      if (verbose) {
        console.log(`Found date field with exact match: ${field}`);
      }
      return field;
    }
  }

  // If no exact match, try partial matches
  const rowKeys = Object.keys(row);
  for (const key of rowKeys) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("date") ||
      lowerKey.includes("txn") ||
      lowerKey.includes("trans") ||
      lowerKey.includes("time")
    ) {
      if (verbose) {
        console.log(`Found date field with partial match: ${key}`);
      }
      return key;
    }
  }

  // If still no match, try to detect based on value format
  for (const key of rowKeys) {
    const value = row[key];
    if (value) {
      // Check if value looks like a date
      if (value instanceof Date) {
        if (verbose) {
          console.log(`Found date field by value type (Date object): ${key}`);
        }
        return key;
      }

      if (typeof value === "string") {
        // Check for common date formats
        if (
          /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(value) || // MM/DD/YYYY or DD/MM/YYYY
          /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(value) || // YYYY/MM/DD
          /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4}/.test(value)
        ) {
          // Month DD, YYYY
          if (verbose) {
            console.log(
              `Found date field by value format (string): ${key} = ${value}`,
            );
          }
          return key;
        }
      }

      if (typeof value === "number") {
        // Excel stores dates as serial numbers
        // Typical Excel date serial numbers are between 0 (1900-01-00) and ~45000 (2023)
        if (value > 0 && value < 50000) {
          if (verbose) {
            console.log(
              `Found potential date field by value range (number): ${key} = ${value}`,
            );
          }
          return key;
        }
      }
    }
  }

  console.error("No date field found in row");
  if (verbose) {
    console.log("Row data for debugging:", row);
  }
  return null;
};

/**
 * Find the amount field in the data row
 * @param {Object} row - The data row to search for amount field
 * @param {boolean} verbose - Whether to log verbose information
 * @returns {string|null} - The name of the amount field or null if not found
 */
export const findAmountField = (row, verbose = true) => {
  if (!row) {
    console.error("No row data provided to findAmountField");
    return null;
  }

  if (verbose) {
    console.log("Finding amount field in row with keys:", Object.keys(row));
  }

  const possibleAmountFields = [
    "Amount",
    "amount",
    "AMOUNT",
    "Debit",
    "Credit",
    "DEBIT",
    "CREDIT",
    "Amount (USD)",
    "AMOUNT (USD)",
    "Amt",
    "AMT",
    "amt",
    "Sum",
    "SUM",
    "sum",
    "Total",
    "TOTAL",
    "total",
    "Value",
    "VALUE",
    "value",
  ];

  // First try exact matches
  for (const field of possibleAmountFields) {
    if (field in row) {
      if (verbose) {
        console.log(`Found amount field with exact match: ${field}`);
      }
      return field;
    }
  }

  // If no exact match, try partial matches
  const rowKeys = Object.keys(row);
  for (const key of rowKeys) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("amount") ||
      lowerKey.includes("amt") ||
      lowerKey.includes("debit") ||
      lowerKey.includes("credit") ||
      lowerKey.includes("sum") ||
      lowerKey.includes("total") ||
      lowerKey.includes("value") ||
      lowerKey.includes("price")
    ) {
      if (verbose) {
        console.log(`Found amount field with partial match: ${key}`);
      }
      return key;
    }
  }

  // If still no match, try to detect based on value format
  for (const key of rowKeys) {
    const value = row[key];
    if (value) {
      if (typeof value === "number") {
        if (verbose) {
          console.log(
            `Found potential amount field by value type (number): ${key} = ${value}`,
          );
        }
        return key;
      }

      if (typeof value === "string") {
        // Check if string looks like a currency amount
        if (/^\$?\-?[\d,]+(\.\d{1,2})?$/.test(value)) {
          if (verbose) {
            console.log(
              `Found amount field by value format (currency string): ${key} = ${value}`,
            );
          }
          return key;
        }
      }
    }
  }

  console.error("No amount field found in row");
  if (verbose) {
    console.log("Row data for debugging:", row);
  }
  return null;
};
