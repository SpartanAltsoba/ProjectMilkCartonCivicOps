import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 items-center h-16">
          {/* Left - Empty */}
          <div></div>

          {/* Center - Project Title */}
          <div className="flex justify-center items-center">
            <span className="text-2xl font-bold text-gray-800">Project Milk Carton</span>
          </div>

          {/* Right - CIVIC TRACE OPS and Donate */}
          <div className="flex justify-end items-center space-x-4">
            <span className="text-xl font-bold text-blue-600">CIVIC TRACE OPS</span>
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              DONATE
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
