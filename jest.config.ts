import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",

  testMatch: ["<rootDir>/apps/web/src/server/**/*.test.ts"],

  moduleNameMapper: {
    "^@/src/(.*)$": "<rootDir>/apps/web/src/$1",
    "^@/(.*)$": "<rootDir>/$1",
  },

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/apps/web/tsconfig.json",
      },
    ],
  },

  clearMocks: true,
};

export default config;
