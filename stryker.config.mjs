const reportName = process.env.NKDK_STRYKER_REPORT_NAME ?? "mutation"
const hasExplicitTestFiles = process.env.NKDK_STRYKER_TEST_FILES !== undefined

/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
export default {
  mutate: [],
  ignorePatterns: [".pnpm-store"],
  // Не даём Stryker 9.6.1 обрабатывать tsconfig через удалённый в TypeScript 7 API.
  tsconfigFile: "tsconfig.stryker-unused.json",
  // Vitest преобразует TypeScript без отдельной проверки типов.
  disableTypeChecks: false,
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  concurrency: 4,
  timeoutMS: 30_000,
  vitest: {
    configFile: "packages/core/vitest.config.ts",
    related: !hasExplicitTestFiles,
  },
  reporters: ["clear-text", "progress", "json", "html"],
  jsonReporter: {
    fileName: `reports/stryker/${reportName}.json`,
  },
  htmlReporter: {
    fileName: `reports/stryker/${reportName}.html`,
  },
}
