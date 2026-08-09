export const neutralProductionPattern =
  "^packages/core/metadata/(?:ruleRuntime|diagnostics|validation|project|projectDefinition|projectState|resourceTopology/core|standardMembers)/"

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
export const diagnosticsValidationReachabilityRule = {
  name: "diagnostics-not-reach-validation",
  severity: "error",
  comment: "Diagnostics не зависит от реализации validation.",
  fromPatterns: ["^packages/core/metadata/diagnostics/"],
  toPatterns: ["^packages/core/metadata/validation/"],
}

/** @type {ReachabilityRule} */
export const resourceTopologyCoreReachabilityRule = {
  name: "resource-topology-core-is-leaf",
  severity: "error",
  comment: "Ядро resourceTopology не зависит от metadata-адаптеров.",
  fromPatterns: ["^packages/core/metadata/resourceTopology/core/"],
  toPatterns: [
    "^packages/core/metadata/(?:ruleRuntime|project|configurationIndex|resourceTopology/adapters)/",
  ],
}

/** @type {ReachabilityRule} */
export const validationProjectReachabilityRule = {
  name: "validation-not-reach-project",
  severity: "error",
  comment: "Validation не зависит от project-координаторов и изменяемого реестра projectDefinition.",
  fromPatterns: ["^packages/core/metadata/validation/"],
  toPatterns: [
    "^packages/core/metadata/project/",
    "^packages/core/metadata/projectDefinition/projectSpecRegistry\\.ts$",
  ],
}

/** @type {ReachabilityRule} */
export const projectDefinitionReachabilityRule = {
  name: "project-definition-is-leaf",
  severity: "error",
  comment: "ProjectDefinition не зависит от координации project, validation, projectState и workerPool.",
  fromPatterns: ["^packages/core/metadata/projectDefinition/"],
  toPatterns: [
    "^packages/core/metadata/(?:project|validation|projectState|workerPool)/",
  ],
}

/** @type {ReachabilityRule} */
export const metadataCompositionReachabilityRule = {
  name: "metadata-core-not-reach-composition",
  severity: "error",
  comment: "Обычные metadata-модули не зависят от composition roots.",
  fromPatterns: ["^packages/core/metadata/(?!composition/)"],
  fromNotPatterns: [
    "^packages/core/metadata/workerPool/(?:worker|preparedYamlProjectEntry)\\.ts$",
    "^packages/core/metadata/(?:importFromXml|fullSyncToXml)/worker\\.ts$",
  ],
  toPatterns: ["^packages/core/metadata/composition/"],
}

const layerReachabilityRule = (name, from, targets) => ({
  name,
  severity: "error",
  comment: `Слой ${from} не достигает более конкретных реализаций.`,
  fromPatterns: [`^packages/core/metadata/${from}/`],
  toPatterns: [`^packages/core/metadata/(?:${targets.join("|")})/`],
})

export const concreteLayerReachabilityRules = [
  layerReachabilityRule("system-enumerations-stay-lower", "systemEnumerations", ["forms", "appliedObjects"]),
  layerReachabilityRule("common-objects-stay-lower", "commonObjects", ["forms", "appliedObjects"]),
  layerReachabilityRule("forms-stay-lower", "forms", ["appliedObjects"]),
]

export const localLeafReachabilityRules = [
  {
    name: "project-state-contracts-are-leaf",
    fromPatterns: ["^packages/core/metadata/projectState/contracts/"],
    toPatterns: [
      "^packages/core/metadata/projectState/(?:binary|fileUpdate|readSession|service|store)",
      "^packages/core/metadata/validation/",
    ],
  },
  {
    name: "project-state-service-does-not-compose",
    fromPatterns: ["^packages/core/metadata/projectState/service\\.ts$"],
    toPatterns: [
      "^packages/core/metadata/project/preparedYamlProjectWorkerPool\\.ts$",
      "^packages/core/metadata/workerPool/handle\\.ts$",
    ],
  },
  {
    name: "worker-pool-types-are-leaf",
    fromPatterns: ["^packages/core/metadata/workerPool/types\\.ts$"],
    toPatterns: ["^packages/core/metadata/(?:project|fullSyncToXml|importFromXml)/"],
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
    "^packages/core/metadata/example/(?:contracts|core)/",
  ],
  toPatterns: ["^packages/core/metadata/example/adapters/"],
}

export const metadataReachabilityRules = [
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
      reachable: true,
    },
  }
}
