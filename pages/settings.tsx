import React, { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import UserSettingsComponent from '../components/UserSettingsComponent';

const SettingsPage: NextPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;

  if (!user) return null; // Will redirect to login

  return (
    <div className="settings-container">
      <UserSettingsComponent userData={{
        email: user.email || '',
        displayName: user.displayName || '',
        privacySettings: { shareDataWithAgents: false }
      }} />
    </div>
  );
};

export default SettingsPage;

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