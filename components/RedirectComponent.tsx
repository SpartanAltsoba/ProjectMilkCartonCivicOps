import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

interface RedirectComponentProps {
  destination?: string;
}

const RedirectComponent: React.FC<RedirectComponentProps> = ({ destination }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if not loading
    if (!isLoading) {
      if (user) {
        router.push(destination || '/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router, destination]);

  return null;
};

export default RedirectComponent;
