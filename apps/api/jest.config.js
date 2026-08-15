module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.(t|j)s$": "ts-jest" },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coveragePathIgnorePatterns: ["\\.module\\.ts$", "\\.dto\\.ts$", "main.ts", "worker.ts"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: { "^database$": "<rootDir>/../../../packages/database/src/index.ts" },
};
