import React, { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import UserSettingsComponent from '../components/UserSettingsComponent';
import styles from '../styles/UserSettingsComponent.module.css';

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
    <div className={styles.settingsContainer}>
      <UserSettingsComponent userData={{
        email: user.email || '',
        displayName: user.displayName || '',
        privacySettings: { shareDataWithAgents: false }
      }} />
    </div>
  );
};

export default SettingsPage;
