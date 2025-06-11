import React from 'react';
import { NextPage } from 'next';
import { useAuth } from '../hooks/useAuth';
import { UserSettingsComponent } from '../components/UserSettingsComponent';
import { withProtected } from '../lib/auth';

const SettingsPage: NextPage = () => {
  const { user, loading, error } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="settings-container">
      {user ? (
        <UserSettingsComponent userData={user} />
      ) : (
        <div>Please log in to manage your settings.</div>
      )}
    </div>
  );
};

// Ensure the page is only accessible to authenticated users
export default withProtected(SettingsPage);

// styles.css
// You might want to add or import some CSS to style your page better
const styles = `
  .settings-container {
    padding: 20px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 10px;
    max-width: 800px;
    margin: 20px auto;
    box-shadow: 0px 4px 14px rgba(0, 0, 0, 0.1);
  }
`;

// Considering to import and apply the styles globally or appropriately in the application. This is just a placeholder.