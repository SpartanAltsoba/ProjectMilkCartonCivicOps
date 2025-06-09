import React from 'react';

interface OverviewSectionProps {
  content: string;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ content }) => {
  return (
    <section className="bg-gray-100 p-8 rounded-md shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">Application Overview</h2>
      <p className="text-gray-700 leading-relaxed">{content}</p>
    </section>
  );
};

export default OverviewSection;
