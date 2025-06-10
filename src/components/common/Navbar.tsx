import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface NavbarProps {
  currentPage?: string;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage }) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (pathname: string) => {
    return router.pathname === pathname
      ? "text-blue-500 border-b-2 border-blue-500"
      : "text-gray-700 hover:text-blue-500";
  };

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(!mobileMenuOpen);
  }, [mobileMenuOpen]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <nav
      className="bg-white border-b border-gray-200 sticky top-0 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span className="sr-only">CIVIC TRACE OPS - Return to homepage</span>
                CIVIC TRACE OPS
              </Link>
            </div>
            <div className="hidden sm:block sm:ml-6" role="menubar">
              <div className="flex space-x-4" role="none">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive("/")}`}
                  role="menuitem"
                  aria-current={router.pathname === "/" ? "page" : undefined}
                >
                  Home
                </Link>
                <Link
                  href="/decision-chain"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive("/decision-chain")}`}
                  role="menuitem"
                  aria-current={router.pathname === "/decision-chain" ? "page" : undefined}
                >
                  Decision Chain
                </Link>
                <Link
                  href="/foia-generator"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive("/foia-generator")}`}
                  role="menuitem"
                  aria-current={router.pathname === "/foia-generator" ? "page" : undefined}
                >
                  FOIA Generator
                </Link>
                <Link
                  href="/search"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive("/search")}`}
                  role="menuitem"
                  aria-current={router.pathname === "/search" ? "page" : undefined}
                >
                  Search
                </Link>
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive("/dashboard")}`}
                  role="menuitem"
                  aria-current={router.pathname === "/dashboard" ? "page" : undefined}
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      <div
        className={`sm:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
        onClick={() => setMobileMenuOpen(false)}
      ></div>

      <div
        className={`sm:hidden fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-white shadow-xl transform transition-transform ease-in-out duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white h-full overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              className="rounded-md p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <Link
            href="/"
            className={`block px-4 py-3 rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive("/")}`}
            onClick={() => setMobileMenuOpen(false)}
            role="menuitem"
            aria-current={router.pathname === "/" ? "page" : undefined}
          >
            Home
          </Link>
          <Link
            href="/decision-chain"
            className={`block px-4 py-3 rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive("/decision-chain")}`}
            onClick={() => setMobileMenuOpen(false)}
            role="menuitem"
            aria-current={router.pathname === "/decision-chain" ? "page" : undefined}
          >
            Decision Chain
          </Link>
          <Link
            href="/foia-generator"
            className={`block px-4 py-3 rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive("/foia-generator")}`}
            onClick={() => setMobileMenuOpen(false)}
            role="menuitem"
            aria-current={router.pathname === "/foia-generator" ? "page" : undefined}
          >
            FOIA Generator
          </Link>
          <Link
            href="/search"
            className={`block px-4 py-3 rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive("/search")}`}
            onClick={() => setMobileMenuOpen(false)}
            role="menuitem"
            aria-current={router.pathname === "/search" ? "page" : undefined}
          >
            Search
          </Link>
          <Link
            href="/dashboard"
            className={`block px-4 py-3 rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive("/dashboard")}`}
            onClick={() => setMobileMenuOpen(false)}
            role="menuitem"
            aria-current={router.pathname === "/dashboard" ? "page" : undefined}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
