import React, { memo } from "react";
import Link from "next/link";

// Define the Footer component
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Brand and Site Description */}
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h1 className="text-xl font-bold">CIVIC TRACE OPS</h1>
          <p className="text-sm">
            Investigating, mapping, and reporting the elements of the child welfare system.
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="text-center">
          <ul className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/decision-chain" className="hover:underline">
                Decision Chain
              </Link>
            </li>
            <li>
              <Link href="/foia-generator" className="hover:underline">
                FOIA Generator
              </Link>
            </li>
            <li>
              <Link href="/search" className="hover:underline">
                Search
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
            </li>
          </ul>
        </nav>

        {/* Contact Information */}
        <div className="text-center md:text-right mt-4 md:mt-0">
          <p className="text-sm">
            Contact us at{" "}
            <a href="mailto:info@civictraceops.org" className="underline">
              info@civictraceops.org
            </a>
          </p>
          <p className="text-sm">© {currentYear} CIVIC TRACE OPS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);
