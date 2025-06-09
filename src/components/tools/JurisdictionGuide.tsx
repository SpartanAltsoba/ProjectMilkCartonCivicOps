import React, { memo } from "react";
import PropTypes from "prop-types";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface JurisdictionGuideProps {
  jurisdictionDetails: {
    id: string;
    name: string;
    foiaFee?: string | null;
    processingTime?: string | null;
    contactInfo?: string | null;
  };
  faqs: FAQ[];
}

const JurisdictionGuide: React.FC<JurisdictionGuideProps> = ({ jurisdictionDetails, faqs }) => {
  const { name, foiaFee, processingTime, contactInfo } = jurisdictionDetails;

  return (
    <div className="p-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-semibold mb-4">FOIA Guidelines for {name}</h2>
      <div className="mb-4">
        {foiaFee && (
          <p>
            <strong>FOIA Fee: </strong>
            {foiaFee}
          </p>
        )}
        {processingTime && (
          <p>
            <strong>Typical Processing Time: </strong>
            {processingTime}
          </p>
        )}
        {contactInfo && (
          <p>
            <strong>Contact Information: </strong>
            {contactInfo}
          </p>
        )}
      </div>
      <h3 className="text-lg font-medium mb-2">Frequently Asked Questions</h3>
      <ul className="list-disc list-inside">
        {faqs.map(faq => (
          <li key={faq.id} className="mb-2">
            <strong>{faq.question}</strong>
            <p>{faq.answer}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

JurisdictionGuide.propTypes = {
  jurisdictionDetails: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    foiaFee: PropTypes.string,
    processingTime: PropTypes.string,
    contactInfo: PropTypes.string,
  }).isRequired,
  faqs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      question: PropTypes.string.isRequired,
      answer: PropTypes.string.isRequired,
    }).isRequired
  ).isRequired,
};

export default memo(JurisdictionGuide);
