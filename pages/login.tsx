import { useState } from 'react';
import AuthFormComponent from '../components/AuthFormComponent';
import styles from '../styles/AuthFormComponent.module.css';

const LoginPage: React.FC = () => {
  const [error, setError] = useState('');

  const handleError = (error: Error) => {
    setError(error.message);
  };

  const handleSuccess = () => {
    setError(''); // Clear any previous errors on successful auth
  };

  return (
    <div className={styles.loginPage}>
      <h1>Authentication</h1>
      <AuthFormComponent
        onSubmit={handleSuccess}
        onError={handleError}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default LoginPage;
