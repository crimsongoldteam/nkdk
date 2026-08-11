export const neutralProductionPattern = "^packages/runtime/"

export const implementationTargetPatterns = [
  "^packages/rules/",
  "^packages/rules/metadata/(?:appliedObjects|forms|commonObjects|systemEnumerations|operations|importFromXml)/",
  "^packages/rules/metadata/register\\.ts$",
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
export const diagnosticsValidationReachabilityRule = {
  name: "diagnostics-not-reach-validation",
  severity: "error",
  comment: "Diagnostics не зависит от реализации validation.",
  fromPatterns: ["^packages/rules/metadata/diagnostics/"],
  toPatterns: ["^packages/rules/metadata/validation/"],
}

/** @type {ReachabilityRule} */
export const resourceTopologyCoreReachabilityRule = {
  name: "resource-topology-core-is-leaf",
  severity: "error",
  comment: "Ядро resourceTopology не зависит от metadata-адаптеров.",
  fromPatterns: ["^packages/rules/metadata/resourceTopology/core/"],
  toPatterns: [
    "^packages/rules/metadata/(?:ruleRuntime|project|configurationIndex|resourceTopology/adapters)/",
  ],
}

/** @type {ReachabilityRule} */
export const validationProjectReachabilityRule = {
  name: "validation-not-reach-project",
  severity: "error",
  comment: "Validation не зависит от project-координаторов и изменяемого реестра projectDefinition.",
  fromPatterns: ["^packages/rules/metadata/validation/"],
  toPatterns: [
    "^packages/rules/metadata/project/",
    "^packages/rules/metadata/projectDefinition/projectSpecRegistry\\.ts$",
  ],
}

/** @type {ReachabilityRule} */
export const projectDefinitionReachabilityRule = {
  name: "project-definition-is-leaf",
  severity: "error",
  comment: "ProjectDefinition не зависит от координации project, validation, projectState и workerPool.",
  fromPatterns: ["^packages/rules/metadata/projectDefinition/"],
  toPatterns: [
    "^packages/rules/metadata/(?:project|validation|projectState|workerPool)/",
  ],
}

/** @type {ReachabilityRule} */
export const metadataCompositionReachabilityRule = {
  name: "metadata-core-not-reach-composition",
  severity: "error",
  comment: "Обычные metadata-модули не зависят от composition roots.",
  fromPatterns: ["^packages/rules/metadata/(?!composition/)"],
  fromNotPatterns: [
    "^packages/rules/metadata/workerPool/(?:worker|preparedYamlProjectEntry|generateProjectValidationAjvStandaloneEntry)\\.ts$",
    "^packages/rules/metadata/(?:importFromXml|fullSyncToXml)/worker\\.ts$",
  ],
  toPatterns: ["^packages/rules/metadata/composition/"],
}

const layerReachabilityRule = (name, from, targets) => ({
  name,
  severity: "error",
  comment: `Слой ${from} не достигает более конкретных реализаций.`,
  fromPatterns: [`^packages/rules/metadata/${from}/`],
  toPatterns: [`^packages/rules/metadata/(?:${targets.join("|")})/`],
})

export const concreteLayerReachabilityRules = [
  layerReachabilityRule("system-enumerations-stay-lower", "systemEnumerations", ["forms", "appliedObjects"]),
  layerReachabilityRule("common-objects-stay-lower", "commonObjects", ["forms", "appliedObjects"]),
  layerReachabilityRule("forms-stay-lower", "forms", ["appliedObjects"]),
]

export const localLeafReachabilityRules = [
  {
    name: "project-state-contracts-are-leaf",
    fromPatterns: ["^packages/rules/metadata/projectState/contracts/"],
    toPatterns: [
      "^packages/rules/metadata/projectState/(?:binary|fileUpdate|readSession|service|store)",
      "^packages/rules/metadata/validation/",
    ],
  },
  {
    name: "project-state-service-does-not-compose",
    fromPatterns: ["^packages/rules/metadata/projectState/service\\.ts$"],
    toPatterns: [
      "^packages/rules/metadata/project/preparedYamlProjectWorkerPool\\.ts$",
      "^packages/rules/metadata/workerPool/handle\\.ts$",
    ],
  },
  {
    name: "worker-pool-types-are-leaf",
    fromPatterns: ["^packages/rules/metadata/workerPool/types\\.ts$"],
    toPatterns: ["^packages/rules/metadata/(?:project|fullSyncToXml|importFromXml)/"],
  },
].map((rule) => ({
  ...rule,
  severity: "error",
  comment: "Нижний договор не достигает реализации.",
}))

/** @type {ReachabilityRule} */
export const exampleCoreReachabilityRule = {
  name: "example-core-not-reach-adapters",
  severity: "error",
  comment: "Нижние зоны synthetic-примера не знают adapters.",
  fromPatterns: [
    "^packages/rules/metadata/example/(?:contracts|core)/",
  ],
  toPatterns: ["^packages/rules/metadata/example/adapters/"],
}

/** @type {ReachabilityRule} */
export const runtimeDoesNotReachRulesRule = {
  name: "runtime-does-not-reach-rules",
  severity: "error",
  comment: "Runtime не зависит от конкретного набора rules.",
  fromPatterns: ["^packages/runtime/"],
  toPatterns: ["^packages/rules/"],
}

/** @type {ReachabilityRule} */
export const rulesDoesNotReachRuntimeInternalsRule = {
  name: "rules-does-not-reach-runtime-internals",
  severity: "ignore",
  comment: "Rules использует только публичные точки входа runtime.",
  fromPatterns: ["^packages/rules/"],
  toPatterns: ["^packages/runtime/"],
  toNotPatterns: [
    "^packages/runtime/(?:index|rule-kit|worker)\\.ts$",
  ],
  reachable: false,
}

/** @type {ReachabilityRule} */
export const packageCompositionRootOnlyInMcpRule = {
  name: "package-composition-root-only-in-mcp",
  severity: "error",
  comment: "Готовый набор rules подключает только MCP как composition root.",
  fromPatterns: ["^packages/(?!mcp/|rules/)"],
  toPatterns: ["^packages/rules/"],
}

export const metadataReachabilityRules = [
  runtimeDoesNotReachRulesRule,
  packageCompositionRootOnlyInMcpRule,
  metadataImplementationReachabilityRule,
  diagnosticsValidationReachabilityRule,
  resourceTopologyCoreReachabilityRule,
  validationProjectReachabilityRule,
  projectDefinitionReachabilityRule,
  metadataCompositionReachabilityRule,
  ...concreteLayerReachabilityRules,
  ...localLeafReachabilityRules,
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
      ...(rule.reachable === false ? {} : { reachable: true }),
    },
  }
}
