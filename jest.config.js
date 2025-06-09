module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  setupFiles: ["dotenv/config"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
    "^.+\\.(js|jsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  transformIgnorePatterns: ["node_modules/(?!(uuid)/)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
