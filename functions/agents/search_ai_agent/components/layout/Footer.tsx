import React from 'react';
import Link from 'next/link';
import { FaTwitter, FaFacebookF, FaLinkedinIn } from 'react-icons/fa';

// Define the types for the component props
interface FooterProps {
  contactInfo: {
    email: string;
    phone: string;
  };
  socialLinks: {
    twitter: string;
    facebook: string;
    linkedin: string;
  };
}

const Footer: React.FC<FooterProps> = ({ contactInfo, socialLinks }) => {
  // Render the footer
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-4">
          {/* Contact Information */}
          <div>
            <p className="font-bold">Contact Us</p>
            <p>Email: <a href={`mailto:${contactInfo.email}`} className="underline">{contactInfo.email}</a></p>
            <p>Phone: <a href={`tel:${contactInfo.phone}`} className="underline">{contactInfo.phone}</a></p>
          </div>

          {/* Social Media Links */}
          <div className="flex space-x-4">
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-2xl">
              <FaTwitter aria-label="Twitter" />
            </a>
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-2xl">
              <FaFacebookF aria-label="Facebook" />
            </a>
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-2xl">
              <FaLinkedinIn aria-label="LinkedIn" />
            </a>
          </div>
        </div>

        <div className="text-center text-gray-400 text-xs">
          <p>&copy; {new Date().getFullYear()} Civic Trace Ops. All rights reserved.</p>
          <Link href="/privacy-policy">
            <a className="underline">Privacy Policy</a>
          </Link>
          {' | '}
          <Link href="/terms-of-service">
            <a className="underline">Terms of Service</a>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
