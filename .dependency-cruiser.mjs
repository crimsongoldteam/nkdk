import { projectCommonRules } from "./tools/dependency-cruiser/src/common-rules.mjs"
import { allowedNeutralRules } from "./tools/dependency-cruiser/src/metadata-rules.mjs"

export default {
  forbidden: projectCommonRules,
  allowed: allowedNeutralRules,
  allowedSeverity: "error",
  options: {
    tsConfig: { fileName: "tsconfig.dependency-cruiser.json" },
    parser: "tsc",
    tsPreCompilationDeps: true,
    moduleSystems: ["es6", "cjs"],
    includeOnly: "^packages/",
    exclude: { path: "(^|/)(?:node_modules|dist|generated)(?:/|$)" },
    doNotFollow: { path: "(?:node_modules|__fixtures__)" },
    skipAnalysisNotInRules: true,
    cache: {
      folder: "node_modules/.cache/dependency-cruiser-v1",
      strategy: "content",
    },
  },
}
