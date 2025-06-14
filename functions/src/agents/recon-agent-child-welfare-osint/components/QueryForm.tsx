import React, { useState, FormEvent } from 'react';

interface QueryFormProps {
  onSubmit: (query: string) => void;
}

const QueryForm: React.FC<QueryFormProps> = ({ onSubmit }) => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (query.trim() === '') {
      setError('Query cannot be empty. Please enter a valid search term.');
      return;
    }

    setError(null);
    onSubmit(query);
  };

  return (
    <form onSubmit={handleFormSubmit} className="query-form">
      <div className="form-group">
        <label htmlFor="query" className="form-label">
          Enter Search Query:
        </label>
        <input
          type="text"
          id="query"
          value={query}
          onChange={handleInputChange}
          className="form-control"
          placeholder="Type your query here..."
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="submit-button">
        Search
      </button>
      <style jsx>{`
        .query-form {
          display: flex;
          flex-direction: column;
          align-items: start;
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-label {
          margin-bottom: 5px;
          font-weight: bold;
        }
        .form-control {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .submit-button {
          background-color: #0070f3;
          color: #ffffff;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .submit-button:hover {
          background-color: #005bb5;
        }
        .error-text {
          color: #ff0000;
          font-size: 0.9rem;
        }
      `}</style>
    </form>
  );
};

export default QueryForm;
