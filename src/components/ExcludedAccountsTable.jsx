import React from "react";

const ExcludedAccountsTable = ({
  excludedAccounts,
  onRestoreAccount,
  formatCurrency,
  rowTotals,
}) => {
  if (!excludedAccounts || excludedAccounts.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">
        Excluded Accounts
      </h3>
      <table className="min-w-full border-collapse border border-gray-300 table-auto rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-gray-800">
            <th className="border border-gray-300 p-3 text-left font-semibold">
              Account
            </th>
            <th className="border border-gray-300 p-3 text-right font-semibold">
              Total
            </th>
            <th className="border border-gray-300 p-3 text-center font-semibold">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {excludedAccounts.map((account) => (
            <tr key={account} className="hover:bg-gray-50 even:bg-gray-50">
              <td className="border border-gray-300 p-3 font-medium">
                {account}
              </td>
              <td className="border border-gray-300 p-3 text-right font-medium">
                {formatCurrency(rowTotals[account] || 0)}
              </td>
              <td className="border border-gray-300 p-3 text-center">
                <button
                  onClick={() => onRestoreAccount(account)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg shadow-sm transition duration-200"
                >
                  Restore
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExcludedAccountsTable;
