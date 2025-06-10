import React, { useState, useCallback, ChangeEvent } from "react";

interface ExportOptionsProps {
  exportTypes: string[];
  selectedOptions: string[];
  onExport: (options: string[]) => void;
}

interface CheckboxProps {
  type: string;
  checked: boolean;
  onToggle: (type: string) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ type, checked, onToggle }) => {
  const handleChange = useCallback(
    (_e: ChangeEvent<HTMLInputElement>) => {
      onToggle(type);
    },
    [type, onToggle]
  );

  return (
    <label className="inline-flex items-center" data-testid={`checkbox-${type}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="form-checkbox mr-2"
      />
      {type}
    </label>
  );
};

const ExportOptions: React.FC<ExportOptionsProps> = ({
  exportTypes,
  selectedOptions,
  onExport,
}) => {
  const [selected, setSelected] = useState<string[]>(selectedOptions);

  const handleToggleOption = useCallback((option: string) => {
    setSelected(prevSelected => {
      if (prevSelected.includes(option)) {
        return prevSelected.filter(item => item !== option);
      } else {
        return [...prevSelected, option];
      }
    });
  }, []);

  const handleExport = useCallback(() => {
    try {
      if (selected.length === 0) {
        alert("Please select at least one export option.");
        return;
      }
      onExport(selected);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("An error occurred while exporting data. Please try again.");
    }
  }, [selected, onExport]);

  return (
    <div className="export-options p-4 border rounded-md shadow-md bg-white">
      <h3 className="text-lg font-semibold mb-2">Choose Export Options</h3>
      <ul className="mb-4">
        {exportTypes.map(type => (
          <li key={type} className="mb-1">
            <Checkbox type={type} checked={selected.includes(type)} onToggle={handleToggleOption} />
          </li>
        ))}
      </ul>
      <button
        onClick={handleExport}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        data-testid="export-button"
      >
        Export
      </button>
    </div>
  );
};

export default React.memo(ExportOptions);
