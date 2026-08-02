import { commonRules } from "./src/common-rules.mjs"

export default {
  forbidden: commonRules,
  options: {
    parser: "tsc",
    tsPreCompilationDeps: true,
    moduleSystems: ["es6", "cjs"],
    doNotFollow: { path: "node_modules" },
    skipAnalysisNotInRules: true,
  },
}
