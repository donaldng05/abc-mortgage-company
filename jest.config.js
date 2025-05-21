/** jest.config.js */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // only transform your TS files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },

  // if ever pull in JS from node_modules that needs transpiling:
  // transformIgnorePatterns: ['/node_modules/'],

  // tell Jest to look for tests in .ts/.tsx files
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],

  // coverage, roots, etc—add more here as needed
};
