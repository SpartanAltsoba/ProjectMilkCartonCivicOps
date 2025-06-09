enum EnvVars {
  CLIENT_ID = "CLIENT_ID",
  SECRET_KEY = "SECRET_KEY",
  FEC_API_KEY = "FEC_API_KEY",
  COURTLISTENER_TOKEN = "COURTLISTENER_TOKEN",
  DATA_GOV_API_KEY = "DATA_GOV_API_KEY",
  GOOGLE_SEARCH_API_KEY = "GOOGLE_SEARCH_API_KEY",
  GOOGLE_CSE_ID = "GOOGLE_CSE_ID",
  OPENAI_API_KEY = "OPENAI_API_KEY",
  GOOGLE_CIVIC_API_KEY = "GOOGLE_CIVIC_API_KEY",
  LOBBY_VIEW_API_KEY = "LOBBY_VIEW_API_KEY",
  EDGAR_API_KEY = "EDGAR_API_KEY",
}

class Config {
  // Fetches an environment variable. If the variable is not set and it's required, throws an error.
  static getEnvVar(name: EnvVars, required: boolean = true): string {
    const value = process.env[name];
    if (!value && required && this.isProductionEnvironment()) {
      throw new Error(`Environment variable ${name} is not set. Please configure it properly.`);
    }
    return value || this.getMockValue(name);
  }

  // Returns a mock value for an environment variable.
  private static getMockValue(name: EnvVars): string {
    const mockValues: Record<string, string> = {
      [EnvVars.COURTLISTENER_TOKEN]: "mock_court_listener_token",
      [EnvVars.DATA_GOV_API_KEY]: "mock_data_gov_api_key",
      [EnvVars.CLIENT_ID]: "mock_client_id",
      [EnvVars.SECRET_KEY]: "mock_secret_key",
      [EnvVars.FEC_API_KEY]: "mock_fec_api_key",
      [EnvVars.GOOGLE_SEARCH_API_KEY]: "mock_google_search_api_key",
      [EnvVars.GOOGLE_CSE_ID]: "mock_google_cse_id",
      [EnvVars.OPENAI_API_KEY]: "mock_openai_api_key",
      [EnvVars.GOOGLE_CIVIC_API_KEY]: "mock_google_civic_api_key",
      [EnvVars.LOBBY_VIEW_API_KEY]: "mock_lobby_view_api_key",
      [EnvVars.EDGAR_API_KEY]: "mock_edgar_api_key",
    };
    return mockValues[name] || `mock_${name.toLowerCase()}`;
  }

  // Checks if the current environment is production.
  static isProductionEnvironment(): boolean {
    return process.env.NODE_ENV === "production";
  }

  // Fetches all the environment variables.
  static getAllEnvVars(): Record<string, string> {
    return Object.values(EnvVars).reduce(
      (acc, curr) => {
        acc[curr] = this.getEnvVar(curr);
        return acc;
      },
      {} as Record<string, string>
    );
  }
}

export default Config;
