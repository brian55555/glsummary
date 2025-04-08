// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the SheetJS library
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
    decode_range: jest.fn(),
    encode_cell: jest.fn(),
    SSF: {
      parse_date_code: jest.fn()
    }
  }
}));

// Mock the lodash library
jest.mock('lodash', () => ({
  uniq: jest.fn(),
}));

// Mock the FileReader API
Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    readAsArrayBuffer: jest.fn(),
    onload: null,
    onerror: null,
  })),
});

// Mock the Intl.NumberFormat API
Object.defineProperty(global, 'Intl', {
  value: {
    NumberFormat: jest.fn().mockImplementation(() => ({
      format: jest.fn(num => `$${num.toFixed(2)}`),
    })),
  },
  writable: true,
});

// Setup window.print mock
window.print = jest.fn();
