import { commonRules } from "./src/common-rules.mjs"
import {
  allowedNeutralRules,
  metadataForbiddenRules,
} from "./src/metadata-rules.mjs"

export default {
  forbidden: [...commonRules, ...metadataForbiddenRules],
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
