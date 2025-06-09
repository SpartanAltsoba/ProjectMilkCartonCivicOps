import { useEffect } from "react";
import { useRouter } from "next/router";

const FOIARedirect: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/foia-generator");
  }, [router]);

  return null;
};

export default FOIARedirect;
