export const testModulePattern =
  "(?:\\.(?:test|spec|bench)\\.[cm]?[jt]sx?$|/(?:tests?|__tests__|__fixtures__)/)"
export const productionSourcePattern =
  "^packages/(?:runtime/|rules/(?:index\\.ts|helpers/|metadata/|xml/|yaml/)|mcp/src/|platform/(?:index\\.ts|src/))"

const productionFrom = {
  path: productionSourcePattern,
  pathNot: testModulePattern,
}

export const commonRules = [
  {
    name: "no-circular-production",
    severity: "error",
    comment:
      "Production-модули не должны образовывать цикл; вынесите общий договор ниже по графу.",
    from: productionFrom,
    to: { circular: true, pathNot: testModulePattern },
  },
  {
    name: "no-unresolvable",
    severity: "error",
    comment:
      "Статический импорт должен разрешаться из зафиксированного workspace.",
    from: {},
    to: { couldNotResolve: true },
  },
  {
    name: "no-production-to-test",
    severity: "error",
    comment:
      "Production-код не импортирует тесты; перенесите общий helper в production-модуль.",
    from: productionFrom,
    to: { path: testModulePattern },
  },
  {
    name: "no-runtime-to-dev-dependency",
    severity: "error",
    comment:
      "Runtime-пакет не должен требовать devDependency; перенесите пакет в dependencies или уберите импорт.",
    from: productionFrom,
    to: { dependencyTypes: ["npm-dev"] },
  },
  {
    name: "core-not-reach-workspace-apps",
    severity: "error",
    comment: "Core не зависит от прикладных workspace-пакетов.",
    from: {
      path: "^packages/rules/",
      pathNot: testModulePattern,
    },
    to: { path: "^packages/(?:mcp|platform)/" },
  },
  {
    name: "platform-is-independent",
    severity: "error",
    comment: "Platform не зависит от core и MCP.",
    from: {
      path: "^packages/platform/",
      pathNot: testModulePattern,
    },
    to: { path: "^packages/(?:rules|mcp)/" },
  },
  {
    name: "mcp-no-workspace-deep-imports",
    severity: "error",
    comment: "MCP импортирует core и platform только через public entrypoints.",
    from: {
      path: "^packages/mcp/src/",
      pathNot: testModulePattern,
    },
    to: {
      path: "^packages/(?:rules/(?!index\\.ts$)|runtime/(?!(?:index|rule-kit|worker)\\.ts$)|platform/(?!index\\.ts$))",
    },
  },
]

export const projectCommonRules = commonRules.filter(
  ({ name }) => name !== "no-circular-production"
)
