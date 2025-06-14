import React from 'react';
import Link from 'next/link';
import styles from '../styles/Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p>&copy; {new Date().getFullYear()} Recon Agent for Child Welfare OSINT</p>
        <nav>
          <ul className={styles.navigationList}>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/analysis">Analysis</Link></li>
            <li><Link href="/logs">Logs</Link></li>
            <li><a href="https://example.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><a href="https://example.com/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
