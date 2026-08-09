import { commonRules } from "./src/common-rules.mjs"
import {
  allowedNeutralRules,
} from "./src/metadata-rules.mjs"
import {
  fixtureReachabilityRules,
  toDependencyCruiserRule,
} from "./src/reachability-rules.mjs"

export default {
  forbidden: [
    ...commonRules,
    ...fixtureReachabilityRules.map(toDependencyCruiserRule),
  ],
  allowed: allowedNeutralRules,
  allowedSeverity: "error",
  options: {
    parser: "tsc",
    tsPreCompilationDeps: true,
    moduleSystems: ["es6", "cjs"],
    doNotFollow: { path: "node_modules" },
    skipAnalysisNotInRules: true,
  },
}
