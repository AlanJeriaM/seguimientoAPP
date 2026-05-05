module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  collectCoverageFrom: [
    "src/services/**/*.js",
    "src/controllers/**/*.js",
    "src/middleware/**/*.js",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
};
