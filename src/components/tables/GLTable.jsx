import React from "react";
import { formatMonthYearForDisplay } from "../../utils/dateParsing";
import { CSVLink } from "react-csv";
import { toPng } from "html-to-image";

const GLTable = ({
  accounts = [],
  months = [],
  summaryData = {},
  calculateRowTotals = () => ({}),
  calculateColumnTotals = () => ({}),
  excludeAccount = () => {},
  formatCurrency = (val) => val,
  tableRef = null,
}) => {
  const [sortConfig, setSortConfig] = React.useState({
    key: null,
    direction: "ascending",
  });

  // Function to handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Format date for display (Jan 2023)
  const formatMonth = formatMonthYearForDisplay;

  // Calculate totals first before using them in sorting or other operations
  const rowTotals = calculateRowTotals();
  const columnTotals = calculateColumnTotals();
  const grandTotal = Object.values(rowTotals).reduce(
    (sum, value) => sum + value,
    0,
  );

  // Get sorted accounts - now rowTotals is defined before being used
  const getSortedAccounts = React.useMemo(() => {
    let sortableAccounts = [...accounts];
    if (sortConfig.key !== null) {
      sortableAccounts.sort((a, b) => {
        // For account name sorting
        if (sortConfig.key === "account") {
          if (a < b) return sortConfig.direction === "ascending" ? -1 : 1;
          if (a > b) return sortConfig.direction === "ascending" ? 1 : -1;
          return 0;
        }

        // For month or total sorting
        const aValue =
          sortConfig.key === "total"
            ? rowTotals[a] || 0
            : summaryData[a]?.[sortConfig.key] || 0;

        const bValue =
          sortConfig.key === "total"
            ? rowTotals[b] || 0
            : summaryData[b]?.[sortConfig.key] || 0;

        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableAccounts;
  }, [accounts, sortConfig, summaryData, rowTotals]);

  // Prepare data for CSV export
  const csvData = [
    // Header row
    ["Account", ...months.map((month) => formatMonth(month)), "Total"],
    // Account rows
    ...accounts.map((account) => [
      account,
      ...months.map((month) => summaryData[account]?.[month] || 0),
      rowTotals[account] || 0,
    ]),
    // Total row
    ["Total", ...months.map((month) => columnTotals[month] || 0), grandTotal],
  ];

  // Function to export table as JPG
  const handleExportAsJpg = () => {
    if (tableRef.current) {
      toPng(tableRef.current, { quality: 0.95 })
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = "general-ledger-export.jpg";
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error("Error exporting as JPG:", error);
        });
    }
  };

  return (
    <div className="" ref={tableRef}>
      <div className="mb-2 flex justify-end">
        <CSVLink
          data={csvData}
          filename={"general-ledger-export.csv"}
          className="btn btn-primary mr-2"
          target="_blank"
        >
          Export to CSV
        </CSVLink>
        <button onClick={handleExportAsJpg} className="btn btn-primary">
          Export to JPG
        </button>
      </div>
      <table className="table table-striped table-hover overflow-hidden">
        <thead>
          <tr className="">
            <th
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort("account")}
            >
              Account
              {sortConfig.key === "account" && (
                <span className="ml-1">
                  {sortConfig.direction === "ascending" ? "↑" : "↓"}
                </span>
              )}
            </th>
            {months.map((month) => (
              <th
                key={month}
                className="text-center cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort(month)}
              >
                {formatMonth(month)}
                {sortConfig.key === month && (
                  <span className="ml-1">
                    {sortConfig.direction === "ascending" ? "↑" : "↓"}
                  </span>
                )}
              </th>
            ))}
            <th
              className="text-center cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort("total")}
            >
              Total
              {sortConfig.key === "total" && (
                <span className="ml-1">
                  {sortConfig.direction === "ascending" ? "↑" : "↓"}
                </span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {getSortedAccounts.map((account) => (
            <tr key={account} className="hover:bg-gray-50 even:bg-gray-50">
              <td
                className=""
                onClick={() => excludeAccount(account)}
                title="Click to exclude this account"
              >
                {account}
              </td>
              {months.map((month) => (
                <td key={`${account}-${month}`} className="text-right">
                  {summaryData[account] && summaryData[account][month] === 0
                    ? "-"
                    : formatCurrency(summaryData[account]?.[month] || 0)}
                </td>
              ))}
              <td className="text-right">
                {formatCurrency(rowTotals[account] || 0)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="">
            <td className="">Total</td>
            {months.map((month) => (
              <td key={`total-${month}`} className="text-right">
                {formatCurrency(columnTotals[month]) || 0}
              </td>
            ))}
            <td className="text-right">{formatCurrency(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default GLTable;
