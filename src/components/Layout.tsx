import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = "Project Milk Carton",
  description = "A platform dedicated to investigating, mapping, and reporting on child welfare systems through data-driven analysis and automated tools.",
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="header">
          <button className="donate-btn">DONATE</button>
        </header>

        {/* Page Title */}
        <h1 className="page-title">Project Milk Carton</h1>

        {/* Main Container - Three Vertical Columns */}
        <div className="main-container">
          {/* Left Panel - Vertical */}
          <div className="side-panel">
            <div className="panel-logo2">
              <div>
                <Image
                  src="/images/logos/logo2.jpg"
                  alt="Logo2"
                  width={250}
                  height={200}
                  priority
                  style={{ width: "auto", height: "auto", objectFit: "contain" }}
                />
              </div>
            </div>

            <h2>
              <Link href="/dashboard" className="h2-link">
                Home Dashboard
              </Link>
            </h2>

            <div className="dropdown">
              <button className="dropdown-btn" aria-haspopup="true" aria-expanded="false">
                Investigative Tools
              </button>
              <div className="dropdown-menu">
                <Link href="/decision-chain">Decision Path Mapper</Link>
                <Link href="/cps-analysis">Agency Risk Audit</Link>
                <Link href="/foia-generator">Generate FOIA Request</Link>
                <Link href="/search">Deep Record Search</Link>
              </div>
            </div>

            <h2>Resources</h2>
            <ul>
              <li>
                <Link href="/documentation">Documentation</Link>
              </li>
              <li>
                <Link href="/user-guides">User Guides</Link>
              </li>
              <li>
                <Link href="/faq">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Center Panel - Main Content */}
          <div className="center-panel">{children}</div>

          {/* Right Panel - Vertical */}
          <div className="side-panel">
            <div className="panel-logo1">
              <div>
                <Image
                  src="/images/logos/logo1.jpg"
                  alt="Logo1"
                  width={100}
                  height={100}
                  priority
                  style={{ width: "auto", height: "auto", objectFit: "contain" }}
                />
              </div>
            </div>

            <div className="glass-panel">
              <div className="button-group">
                <button className="glass-button">Sign In</button>
                <button className="glass-button">Register</button>
              </div>
            </div>

            <ul>
              <li>
                <Link href="/help">Help & Support</Link>
              </li>
              <li>
                <Link href="/contact">Contact Us</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>© 2025 Project Milk Carton</p>
          <div className="footer-links">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/eula">EULA</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/contact">Contact Us</Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;
