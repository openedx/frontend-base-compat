const { createConfig } = require('@openedx/frontend-base/tools');

module.exports = createConfig('test', {
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTest.js',
  ],
  coveragePathIgnorePatterns: [
    'src/setupTest.js',
    'src/__mocks__',
  ],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    /* paragon's `default-avatar.svg` is pulled in via frontend-base's ErrorPage chain. */
    '\\.svg$': '<rootDir>/src/__mocks__/svg.js',
  },
});
