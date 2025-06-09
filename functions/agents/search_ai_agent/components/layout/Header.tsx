import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  title: string;
  navigationLinks: { label: string; href: string }[];
}

const Header: React.FC<HeaderProps> = ({ title, navigationLinks }) => {
  return (
    <header className="bg-blue-500 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        <div className="flex items-center">
          <Image src="/logo.png" alt="Civic Trace Ops" width={50} height={50} />
          <h1 className="text-xl font-bold ml-3">{title}</h1>
        </div>
        <nav className="flex space-x-4">
          {navigationLinks.map((link, index) => (
            <Link key={index} href={link.href} passHref>
              <a className="hover:text-gray-300">{link.label}</a>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
