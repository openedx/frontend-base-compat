// @ts-check

const { createLintConfig } = require('@openedx/frontend-base/tools');

module.exports = createLintConfig(
  {
    files: [
      'src/**/*',
    ],
  },
  {
    ignores: [
      'coverage/*',
      'dist/*',
      'node_modules/*',
    ],
  },
);
