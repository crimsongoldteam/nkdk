import { testModulePattern } from "./common-rules.mjs"
import {
  implementationTargetPatterns,
  metadataReachabilityRules,
  neutralProductionPattern,
  toDependencyCruiserRule,
} from "./reachability-rules.mjs"

export { implementationTargetPatterns, neutralProductionPattern }

const allowedInternalTargets = [
  neutralProductionPattern,
  "^packages/core/metadata/(?:binary|composition|context|helpers|resourceTopology|configurationIndex|components|diagnostics|projectState|workerPool|sourceWorkerRuntime)(?:/|\\.ts$)",
  "^packages/core/(?:helpers|yaml|xml)/",
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

export const metadataForbiddenRules = metadataReachabilityRules.map(
  toDependencyCruiserRule
)
