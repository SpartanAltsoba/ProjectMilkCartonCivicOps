import React, { useState } from "react";

interface LocationInputFormProps {
  onSubmit: (location: string) => void;
}

const LocationInputForm: React.FC<LocationInputFormProps> = ({ onSubmit }) => {
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!location.trim()) {
      setError("Location cannot be empty.");
    } else {
      setError("");
      onSubmit(location.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Enter Location for Analysis</h2>
      <div className="mb-4">
        <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">
          Location
        </label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={handleInputChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="e.g., Los Angeles County"
          aria-describedby="locationError"
        />
        {error && (
          <p id="locationError" className="text-red-500 text-xs mt-1">
            {error}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default LocationInputForm;
