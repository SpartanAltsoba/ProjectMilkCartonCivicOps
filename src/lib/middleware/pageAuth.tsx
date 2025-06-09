import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface WithAuthProps {
  [key: string]: any;
}

const withPageAuth = <P extends WithAuthProps>(WrappedComponent: React.ComponentType<P>) => {
  const AuthenticatedComponent = (props: P) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === "loading") return; // Still loading

      if (!session) {
        router.push("/api/auth/signin");
        return;
      }
    }, [session, status, router]);

    if (status === "loading") {
      return <div>Loading...</div>;
    }

    if (!session) {
      return <div>Redirecting...</div>;
    }

    return <WrappedComponent {...props} />;
  };

  return AuthenticatedComponent;
};

export default withPageAuth;
