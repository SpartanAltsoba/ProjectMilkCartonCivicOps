import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../hooks/useAuth";
import { logger } from "../logger";

interface WithAuthOptions {
  requireEmailVerification?: boolean;
  requiredRole?: string;
  redirectTo?: string;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { requireEmailVerification = true, requiredRole, redirectTo = "/login" } = options;

  const AuthenticatedComponent: React.FC<P> = props => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return;

      if (!user) {
        logger.warn("Unauthorized access attempt", {
          path: router.asPath,
          redirectTo,
        });
        router.push(redirectTo);
        return;
      }

      if (requireEmailVerification && !user.emailVerified) {
        logger.warn("Unverified email access attempt", {
          userId: user.id,
          path: router.asPath,
        });
        router.push("/verify-email");
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        logger.warn("Insufficient permissions", {
          userId: user.id,
          userRole: user.role,
          requiredRole,
          path: router.asPath,
        });
        router.push("/unauthorized");
        return;
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (!user) {
      return null; // Will redirect in useEffect
    }

    if (requireEmailVerification && !user.emailVerified) {
      return null; // Will redirect in useEffect
    }

    if (requiredRole && user.role !== requiredRole) {
      return null; // Will redirect in useEffect
    }

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
}

// Higher-order component for pages that require authentication
export function requireAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: WithAuthOptions
) {
  return withAuth(WrappedComponent, options);
}

// Higher-order component for admin-only pages
export function requireAdmin<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withAuth(WrappedComponent, {
    requireEmailVerification: true,
    requiredRole: "admin",
  });
}

// Example usage:
/*
// Protect a page component
const ProtectedPage = withAuth(MyPageComponent, {
  requireEmailVerification: true,
  requiredRole: 'user'
});

// Or use as decorator
export default withAuth(MyPageComponent);

// For admin pages
export default requireAdmin(AdminPageComponent);
*/
