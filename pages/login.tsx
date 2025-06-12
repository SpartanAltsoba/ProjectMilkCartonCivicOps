import { useState } from 'react';
import AuthFormComponent from '../components/AuthFormComponent';

const LoginPage: React.FC = () => {
  const [error, setError] = useState('');

  const handleError = (error: Error) => {
    setError(error.message);
  };

  const handleSuccess = () => {
    setError(''); // Clear any previous errors on successful auth
  };

  return (
    <div className="login-page">
      <h1>Authentication</h1>
      <AuthFormComponent
        onSubmit={handleSuccess}
        onError={handleError}
      />
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default LoginPage;

// CSS for the page (optional, replace with your CSS framework/styling solution if any)
const style = `
  .login-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .error {
    color: red;
    margin-top: 0.5rem;
  }

  .toggle-form {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #0070f3;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    transition: background-color 0.3s;
  }
  .toggle-form:hover {
    background-color: #005bb5;
  }
`;

<style jsx>{style}</style>