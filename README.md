# QuickBooks General Ledger Monthly Summary

A React.js application that processes QuickBooks Online general ledger exports and creates printable monthly summary tables.

## Features

- **Excel File Processing**: Upload QuickBooks General Ledger Excel files (.xlsx or .xls)
- **Account/Month Breakdown**: View transaction totals organized by account (rows) and month (columns)
- **Automatic Calculations**: Displays sums for each account, each month, and overall total
- **Print-Ready Output**: Clean, professional tables designed for printing or PDF export
- **Responsive Design**: Works well on different screen sizes

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/quickbooks-gl-summary.git
cd quickbooks-gl-summary

# Install dependencies
npm install

# Start the development server
npm start
```

## Usage

1. **Upload your file**:
   - Click the file input or drag and drop your QuickBooks General Ledger Excel file
   - The application accepts .xlsx and .xls file formats

2. **View the summary table**:
   - The table will show accounts listed vertically on the left
   - Months are displayed horizontally across the top
   - Each cell shows the net amount (debits minus credits) for that account in that month
   - Row and column totals are calculated automatically

3. **Print your report**:
   - Click the "Print Report" button
   - Use your browser's print dialog to print or save as PDF
   - The printed version is optimized with appropriate margins and formatting

## File Format Compatibility

This application is designed to work with standard QuickBooks Online General Ledger exports. It looks for these common fields:

- **Date**: Transaction date (used to organize by month)
- **Account**: Account name (used to organize by account)
- **Debit**: Debit amounts
- **Credit**: Credit amounts

The application can handle various date formats and will attempt to detect the appropriate column names in your export.

## Troubleshooting

If you encounter issues processing your file:

- Ensure you're using a standard QuickBooks Online General Ledger export
- Check that your file contains the necessary columns (Date, Account, Debit, Credit)
- Verify that your Excel file isn't password-protected or corrupted

## Technical Details

- Built with React.js
- Uses SheetJS (xlsx) for Excel file parsing
- Styled with Tailwind CSS
- Includes print-specific media queries for optimal printing

## Project Structure

```
quickbooks-gl-summary/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── GeneralLedgerTable.jsx      # Main application component
│   ├── styles/
│   │   └── index.css                   # Tailwind CSS imports and custom styles
│   ├── App.js                          # Application entry point
│   ├── index.js                        # React DOM rendering
│   └── setupTests.js                   # Test configuration
├── package.json                        # Dependencies and scripts
├── tailwind.config.js                  # Tailwind CSS configuration
├── .gitignore                          # Git ignore configuration
└── README.md                           # This documentation

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
