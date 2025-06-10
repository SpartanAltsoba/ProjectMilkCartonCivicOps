import { AxiosHeaderValue } from "axios";
interface Config {
  FEC_API_KEY: any | AxiosHeaderValue | undefined;
  COURTLISTENER_TOKEN: string | undefined;
  GOOGLE_SEARCH_API_KEY: string | undefined;
  GOOGLE_CSE_ID: string | undefined;
  DATA_GOV_API_KEY: string | undefined;
  FIREBASE_CONFIG: {
    apiKey: string | undefined;
    authDomain: string | undefined;
    projectId: string | undefined;
    storageBucket: string | undefined;
    messagingSenderId: string | undefined;
    appId: string | undefined;
    measurementId: string | undefined;
  };
}

const config: Config = {
  COURTLISTENER_TOKEN: process.env.COURTLISTENER_TOKEN,
  GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY,
  GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID,
  DATA_GOV_API_KEY: process.env.DATA_GOV_API_KEY,
  FIREBASE_CONFIG: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  FEC_API_KEY: undefined,
};

export default config;
