import type { LocalYamlFact } from "../orchestration/property/importYamlTypes"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { FormDataPathIndex } from "../validation/dataPath/formIndex"
import type { MetadataTargetConstraint, MetadataTargetOwner } from "../commonObjects/metadataTargets/types"
import { PictureLibFromYAML } from "../systemEnumerations/types"

export interface LocalMetadataEvent {
  kind: "property" | "complete"
  yamlPath: readonly (string | number)[]
  rulePath: LocalYamlFact["rulePath"]
  propertyType: string
  source?: LocalYamlFact["source"]
}

export interface LocalMetadataIndex {
  events: LocalMetadataEvent[]
  ownerFacts?: Readonly<Record<string, unknown>>
  metadataTargets?: LocalMetadataTargetFact[]
  formDataPathIndex?: FormDataPathIndex
}

export interface LocalMetadataTargetFact {
  yamlPath: readonly (string | number)[]
  value: string
  constraint: MetadataTargetConstraint
  owner?: MetadataTargetOwner
  rulePath: LocalYamlFact["rulePath"]
}
export interface LocalIndexes {
  metadata: LocalMetadataIndex
}

export interface LocalIndexesCollector {
  acceptProperty(fact: LocalYamlFact): void
  completeValue(fact: LocalYamlFact): void
  finish(): LocalIndexes
}

export function createLocalIndexesCollector(): LocalIndexesCollector {
  const events: LocalMetadataEvent[] = []
  const ownerFacts: Record<string, unknown> = {}
  const metadataTargets: LocalMetadataTargetFact[] = []
  const writer = {
    setOwnerFact(role: string, value: unknown) {
      ownerFacts[role] = value
    },
  }

  const recordEvent = (kind: LocalMetadataEvent["kind"], fact: LocalYamlFact): void => {
    events.push({
      kind,
      yamlPath: [...fact.yamlPath],
      rulePath: fact.rulePath.map((segment) => ({ ...segment })),
      propertyType: fact.rule.type,
      ...(fact.source === undefined ? {} : { source: { ...fact.source } }),
    })
  }

  const acceptProperty = (fact: LocalYamlFact): void => {
    recordEvent("property", fact)
    getTypeRule(fact.rule.type, "collectLocalFactsFromYAML")?.({ fact, writer })
    collectMetadataTargetFacts(metadataTargets, fact)
  }

  return {
    acceptProperty,
    completeValue: (fact) => recordEvent("complete", fact),
    finish: () => ({
      metadata: {
        events,
        ...(Object.keys(ownerFacts).length === 0 ? {} : { ownerFacts }),
        ...(metadataTargets.length === 0 ? {} : { metadataTargets }),
      },
    }),
  }
}

function collectMetadataTargetFacts(target: LocalMetadataTargetFact[], fact: LocalYamlFact): void {
  const constraint = fact.rule.metadataTarget
  if (constraint === undefined) return

  if (fact.rule.type === "Picture") {
    const structuredPicture =
      typeof fact.value === "object" && fact.value !== null && !Array.isArray(fact.value)
    const picture = structuredPicture ? (fact.value as Record<string, unknown>)["Ссылка"] : fact.value
    if (
      typeof picture === "string" &&
      !(picture in PictureLibFromYAML) &&
      picture.startsWith("ОбщаяКартинка.")
    ) {
      appendMetadataTargetFact(
        target,
        fact,
        constraint,
        picture,
        structuredPicture ? [...fact.yamlPath, "Ссылка"] : fact.yamlPath
      )
    }
    return
  }

  collectStringValues(fact.value, fact.yamlPath, (value, yamlPath) =>
    appendMetadataTargetFact(target, fact, constraint, value, yamlPath)
  )
}

function collectStringValues(
  value: unknown,
  yamlPath: readonly (string | number)[],
  accept: (value: string, yamlPath: readonly (string | number)[]) => void
): void {
  if (typeof value === "string") {
    accept(value, yamlPath)
    return
  }
  if (!Array.isArray(value)) return
  value.forEach((item, index) => collectStringValues(item, [...yamlPath, index], accept))
}

function appendMetadataTargetFact(
  target: LocalMetadataTargetFact[],
  fact: LocalYamlFact,
  constraint: MetadataTargetConstraint,
  value: string,
  yamlPath: readonly (string | number)[]
): void {
  target.push({
    yamlPath: [...yamlPath],
    value,
    constraint,
    ...(fact.metadataTargetOwner === undefined ? {} : { owner: { ...fact.metadataTargetOwner } }),
    rulePath: fact.rulePath.map((segment) => ({ ...segment })),
  })
}
