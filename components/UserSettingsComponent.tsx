import React, { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import styles from '../styles/UserSettingsComponent.module.css';

interface UserSettingsComponentProps {
  userData: { 
    email: string; 
    displayName: string; 
    privacySettings: { shareDataWithAgents: boolean };
  };
}

const UserSettingsComponent: React.FC<UserSettingsComponentProps> = ({ userData }) => {
  const [displayName, setDisplayName] = useState(userData.displayName);
  const [email, setEmail] = useState(userData.email);
  const [shareDataWithAgents, setShareDataWithAgents] = useState(userData.privacySettings.shareDataWithAgents);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      // Handle user not being authenticated
      console.error('User must be authenticated to access settings.');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      if (!user) throw new Error('User not authenticated');
      setIsSaving(true);
      await updateProfile(user, {
        displayName,
      });
      await setDoc(doc(firestore, 'users', user.uid), {
        displayName,
        privacySettings: {
          shareDataWithAgents,
        },
      }, { merge: true });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>User Settings</h1>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleUpdateProfile();
      }}>
        <div className={styles.fieldContainer}>
          <label htmlFor="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSaving}
            required
          />
        </div>
        <div className={styles.fieldContainer}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={true} // Email change is not supported here
            readOnly
          />
        </div>
        <div className={styles.fieldContainer}>
          <label htmlFor="shareDataWithAgents">Share Data with Agents</label>
          <input
            type="checkbox"
            id="shareDataWithAgents"
            checked={shareDataWithAgents}
            onChange={(e) => setShareDataWithAgents(e.target.checked)}
            disabled={isSaving}
          />
        </div>
        <button type="submit" disabled={isSaving} className={styles.saveButton}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default UserSettingsComponent;
