import React from 'react';
import PropTypes from 'prop-types';

interface ContentSectionProps {
  content: string;
}

// A reusable content display section for general text or HTML content.
const ContentSection: React.FC<ContentSectionProps> = ({ content }) => {
  // Function to safely render HTML content
  const createMarkup = (htmlContent: string) => {
    return { __html: htmlContent };
  };

  return (
    <section className="py-4 px-6 max-w-4xl mx-auto">
      <div className="prose lg:prose-xl" dangerouslySetInnerHTML={createMarkup(content)} />
    </section>
  );
};

ContentSection.propTypes = {
  content: PropTypes.string.isRequired,
};

export default ContentSection;
