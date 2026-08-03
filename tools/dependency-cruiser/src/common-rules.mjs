export const testModulePattern =
  "(?:\\.(?:test|spec)\\.[cm]?[jt]sx?$|/(?:tests?|__tests__|__fixtures__)/)"
export const productionSourcePattern =
  "^packages/(?:core/(?:index\\.ts|helpers/|metadata/|xml/|yaml/)|mcp/src/|platform/(?:index\\.ts|src/))"

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
]

export const projectCommonRules = commonRules.filter(
  ({ name }) => name !== "no-circular-production"
)
