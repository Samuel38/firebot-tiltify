import { pathsToModuleNameMapper } from "ts-jest";
const { compilerOptions } = require(`./tsconfig.json`);

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleDirectories: ["node_modules", "<rootDir>"],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: `<rootDir>/`,
  }),
};