/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
export default {
  mutate: ["packages/core/scripts/fixture-wizard/targetResolver.ts"],
  // Не даём Stryker 9.6.1 обрабатывать tsconfig через удалённый в TypeScript 7 API.
  tsconfigFile: "tsconfig.stryker-unused.json",
  // Vitest преобразует TypeScript без отдельной проверки типов.
  disableTypeChecks: false,
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: {
    configFile: "packages/core/vitest.config.ts",
    related: true,
  },
  reporters: ["clear-text", "progress", "html"],
  htmlReporter: {
    fileName: "reports/stryker/pilot.html",
  },
}
