import { testModulePattern } from "./common-rules.mjs"

export const neutralProductionPattern =
  "^packages/core/metadata/(?:orchestration|validation|project|standardMembers)/"

const allowedInternalTargets = [
  "^packages/core/metadata/(?:orchestration|validation|project|standardMembers)/",
  "^packages/core/metadata/(?:context|helpers|resourceTopology|configurationIndex|components|diagnostics|projectState|workerPool|sourceWorkerRuntime)(?:/|\\.ts$)",
  "^packages/core/(?:helpers|yaml|xml)/",
]

export const implementationTargetPatterns = [
  "^packages/core/metadata/(?:appliedObjects|forms|commonObjects|systemEnumerations|operations|importFromXml)/",
  "^packages/core/metadata/register\\.ts$",
]

export const allowedNeutralRules = [
  { from: { pathNot: neutralProductionPattern }, to: {} },
  { from: { path: testModulePattern }, to: {} },
  {
    from: { path: neutralProductionPattern, pathNot: testModulePattern },
    to: { path: allowedInternalTargets },
  },
  {
    from: { path: neutralProductionPattern, pathNot: testModulePattern },
    to: { dependencyTypes: ["core", "npm", "npm-peer", "npm-optional"] },
  },
]

export const metadataForbiddenRules = [
  {
    name: "neutral-not-reach-implementations",
    severity: "error",
    comment:
      "Нейтральный metadata-слой не знает реализацию даже транзитивно; используйте rules.ts, регистрацию или нейтральный договор.",
    from: { path: neutralProductionPattern, pathNot: testModulePattern },
    to: { path: implementationTargetPatterns, reachable: true },
  },
]
