export const neutralProductionPattern =
  "^packages/core/metadata/(?:ruleRuntime|validation|project|standardMembers)/"

export const implementationTargetPatterns = [
  "^packages/core/metadata/(?:appliedObjects|forms|commonObjects|systemEnumerations|operations|importFromXml)/",
  "^packages/core/metadata/register\\.ts$",
]

/**
 * @typedef {object} ReachabilityRule
 * @property {string} name
 * @property {"error" | "warn" | "info" | "ignore"} severity
 * @property {string[]} fromPatterns
 * @property {string[]} [fromNotPatterns]
 * @property {string[]} toPatterns
 * @property {string[]} [toNotPatterns]
 * @property {string} comment
 */

/** @type {ReachabilityRule} */
export const metadataImplementationReachabilityRule = {
  name: "neutral-not-reach-implementations",
  severity: "error",
  comment: "Нейтральный metadata-слой не знает конкретные реализации.",
  fromPatterns: [neutralProductionPattern],
  toPatterns: implementationTargetPatterns,
}

/** @type {ReachabilityRule} */
export const exampleCoreReachabilityRule = {
  name: "example-core-not-reach-adapters",
  severity: "error",
  comment: "Нижние зоны synthetic-примера не знают adapters.",
  fromPatterns: [
    "^packages/core/metadata/example/(?:contracts|core)/",
  ],
  toPatterns: ["^packages/core/metadata/example/adapters/"],
}

export const metadataReachabilityRules = [
  metadataImplementationReachabilityRule,
]

export const fixtureReachabilityRules = [
  ...metadataReachabilityRules,
  exampleCoreReachabilityRule,
]

export function toDependencyCruiserRule(rule) {
  return {
    name: rule.name,
    severity: rule.severity,
    comment: rule.comment,
    from: {
      path: rule.fromPatterns,
      ...(rule.fromNotPatterns
        ? { pathNot: rule.fromNotPatterns }
        : {}),
    },
    to: {
      path: rule.toPatterns,
      ...(rule.toNotPatterns ? { pathNot: rule.toNotPatterns } : {}),
      reachable: true,
    },
  }
}
