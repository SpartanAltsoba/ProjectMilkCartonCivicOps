import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

interface RedirectComponentProps {
  destination?: string;
}

const RedirectComponent: React.FC<RedirectComponentProps> = ({ destination }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if not loading
    if (!loading) {
      if (user) {
        router.push(destination || '/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router, destination]);

  return null;
};

export default RedirectComponent;
