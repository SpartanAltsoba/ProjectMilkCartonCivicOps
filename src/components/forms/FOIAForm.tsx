import React, { useState, FormEvent, ChangeEvent, useCallback } from "react";
import { useRouter } from "next/router";

interface FOIAFormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface FOIAFormProps {
  formFields: FOIAFormField[];
  jurisdictionDetails: string;
}

const FOIAForm: React.FC<FOIAFormProps> = ({ formFields, jurisdictionDetails }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Please log in to submit a FOIA request.");
        return;
      }

      // Prepare request data
      const requestData = {
        regionId: 1, // TODO: Get actual region ID from jurisdiction details
        requestType: "general",
        description: `FOIA Request: ${Object.entries(formData)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")}`,
        ...formData,
      };

      const response = await fetch("/api/foia/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const _result = await response.json();
        router.push("/confirmation");
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Failed to submit FOIA request. Please try again.");
      }
    } catch (error) {
      console.error("FOIA submission error:", error);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">FOIA Request Generation</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {formFields.map((field: FOIAFormField) => (
        <div key={field.name} className="mb-4">
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <input
            type={field.type}
            name={field.name}
            id={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required={field.required}
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={isLoading}
        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isLoading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      >
        {isLoading ? "Submitting..." : "Submit FOIA Request"}
      </button>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Jurisdiction Details</h3>
        <p className="text-sm">{jurisdictionDetails}</p>
      </div>
    </form>
  );
};

export default React.memo(FOIAForm);
