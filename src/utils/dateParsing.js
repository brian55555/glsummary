import * as XLSX from "xlsx";

/**
 * Parse a date value from various formats
 * @param {any} dateValue - The date value to parse
 * @param {boolean} verbose - Whether to log verbose information
 * @returns {Date|null} - The parsed Date object or null if parsing failed
 */
export const parseDate = (dateValue, verbose = true) => {
  if (!dateValue) {
    if (verbose) console.log("No date value provided to parse");
    return null;
  }

  if (verbose) {
    console.log("Parsing date value:", dateValue, typeof dateValue);
  }

  // If it's already a Date object
  if (dateValue instanceof Date) {
    if (verbose) console.log("Value is already a Date object");
    return dateValue;
  }

  try {
    // For format MM/DD/YYYY or DD/MM/YYYY
    if (typeof dateValue === "string" && dateValue.includes("/")) {
      const parts = dateValue.split("/");

      // Determine if it's MM/DD/YYYY or DD/MM/YYYY
      // Assume MM/DD/YYYY for US format (most common in QuickBooks)
      if (parts.length === 3) {
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        // Basic validation
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const date = new Date(year, month - 1, day);
          if (verbose)
            console.log(
              `Parsed date from MM/DD/YYYY format: ${date.toISOString()}`,
            );
          return date;
        }
      }
    }

    // For format YYYY-MM-DD
    if (typeof dateValue === "string" && dateValue.includes("-")) {
      const parts = dateValue.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);

        if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const date = new Date(year, month - 1, day);
          if (verbose)
            console.log(
              `Parsed date from YYYY-MM-DD format: ${date.toISOString()}`,
            );
          return date;
        }
      }
    }

    // For Excel serial number
    if (typeof dateValue === "number") {
      try {
        const date = XLSX.SSF.parse_date_code(dateValue);
        if (date) {
          const jsDate = new Date(date.y, date.m - 1, date.d);
          if (verbose)
            console.log(
              `Parsed date from Excel serial number: ${jsDate.toISOString()}`,
            );
          return jsDate;
        }
      } catch (error) {
        console.error("Error parsing Excel serial date:", error);
      }
    }

    // Default parsing as last resort
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      if (verbose)
        console.log(
          `Parsed date using default Date constructor: ${date.toISOString()}`,
        );
      return date;
    }

    if (verbose) console.error("Failed to parse date value:", dateValue);
    return null;
  } catch (error) {
    console.error("Error parsing date:", error, dateValue);
    return null;
  }
};

/**
 * Format a date as month/year string (e.g., "1/2023")
 * @param {Date} date - The date to format
 * @returns {string} - Formatted month/year string
 */
export const formatMonthYear = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error("Invalid date provided to formatMonthYear", date);
    return "";
  }
  return `${date.getMonth() + 1}/${date.getFullYear()}`;
};

/**
 * Format a month/year string for display (e.g., "Jan 2023")
 * @param {string} monthYear - The month/year string in format "M/YYYY"
 * @returns {string} - Formatted display string
 */
export const formatMonthYearForDisplay = (monthYear) => {
  if (!monthYear || typeof monthYear !== "string") {
    return "";
  }

  const [month, year] = monthYear.split("/");
  try {
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting month/year for display:", error, monthYear);
    return monthYear; // Return original if parsing fails
  }
};
