import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

interface FOIARequestFormProps {
  onSubmit: () => void;
}

interface FOIAFormData {
  recipient: string;
  subject: string;
  description: string;
  agency: string;
}

const FOIARequestForm: React.FC<FOIARequestFormProps> = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FOIAFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to handle form submission
  const onFormSubmit = async (data: FOIAFormData) => {
    setIsSubmitting(true);
    try {
      await axios.post("/api/data/foia", data);
      alert("FOIA Request submitted successfully!");
      onSubmit();
    } catch (error) {
      console.error("Error submitting FOIA request:", error);
      alert("Failed to submit FOIA Request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 bg-white shadow-md rounded-md">
      <div className="mb-4">
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
          Recipient
        </label>
        <input
          id="recipient"
          type="text"
          {...register("recipient", { required: "Recipient is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.recipient && (
          <p className="mt-1 text-red-500 text-sm">{errors.recipient.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          {...register("subject", { required: "Subject is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.subject && <p className="mt-1 text-red-500 text-sm">{errors.subject.message}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          {...register("description", { required: "Description is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.description && (
          <p className="mt-1 text-red-500 text-sm">{errors.description.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="agency" className="block text-sm font-medium text-gray-700">
          Agency
        </label>
        <input
          id="agency"
          type="text"
          {...register("agency", { required: "Agency is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.agency && <p className="mt-1 text-red-500 text-sm">{errors.agency.message}</p>}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
};

export default FOIARequestForm;
