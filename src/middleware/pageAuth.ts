import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import React from "react";

// Simple auth wrapper for pages
const withPageAuth = (WrappedComponent: NextPage): NextPage => {
  const WithPageAuth: NextPage = props => {
    const router = useRouter();

    useEffect(() => {
      // Here you would typically check for authentication
      // For now, we'll just let all requests through since auth isn't implemented yet
      const isAuthenticated = true;

      if (!isAuthenticated) {
        router.push("/login");
      }
    }, [router]);

    return React.createElement(WrappedComponent, props);
  };

  // Copy getInitialProps so it will run as well
  if (WrappedComponent.getInitialProps) {
    WithPageAuth.getInitialProps = WrappedComponent.getInitialProps;
  }

  return WithPageAuth;
};

export default withPageAuth;
