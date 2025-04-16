import React from "react";

const ColumnMappingForm = ({
  availableFields = [],
  customDateField = "",
  customAmountField = "",
  customAccountField = "",
  setCustomDateField,
  setCustomAmountField,
  setCustomAccountField,
}) => {
  return (
    <form className="form-horizontal">
      <div className="form-group">
        <div className="col-12 col-sm-12">
          <h3 className="">Column Mapping</h3>
        </div>
        <div className="col-4 col-sm-12">
          <label className="label">Date:&nbsp;</label>
        </div>
        <div className="col-8 col-sm-12">
          <select
            className="form-select"
            value={customDateField}
            onChange={(e) => setCustomDateField(e.target.value)}
          >
            <option value="">Auto-detect (recommended)</option>
            {availableFields.map((field) => (
              <option key={`date-${field}`} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        <div className="col-4 col-sm-12">
          <label className="label">Account:&nbsp;</label>
        </div>
        <div className="col-8 col-sm-12">
          <select
            value={customAccountField}
            onChange={(e) => setCustomAccountField(e.target.value)}
            className="form-select"
          >
            <option value="">Auto-detect (recommended)</option>
            {availableFields.map((field) => (
              <option key={`account-${field}`} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        <div className="col-4 col-sm-12">
          <label className="label">Amount:&nbsp;</label>
        </div>
        <div className="col-8 col-sm-12">
          <select
            value={customAmountField}
            onChange={(e) => setCustomAmountField(e.target.value)}
            className="form-select"
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
    </form>
  );
};

export default ColumnMappingForm;
