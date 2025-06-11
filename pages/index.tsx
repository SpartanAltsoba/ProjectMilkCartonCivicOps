import { GetServerSideProps } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuthStatus } from '../lib/auth';

interface IndexPageProps {
  isAuthenticated: boolean;
}

const RedirectComponent: React.FC<{ destination: string }> = ({ destination }) => {
  const router = useRouter();

  useEffect(() => {
    router.replace(destination);
  }, [destination]);

  return null;
};

const IndexPage: React.FC<IndexPageProps> = ({ isAuthenticated }) => {
  const destination = isAuthenticated ? '/dashboard' : '/login';
  return <RedirectComponent destination={destination} />;
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const isAuthenticated = await getAuthStatus();
    return {
      props: {
        isAuthenticated,
      },
    };
  } catch (error) {
    console.error('Failed to retrieve authentication status:', error);
    return {
      props: {
        isAuthenticated: false,
      },
    };
  }
};

export default IndexPage;
