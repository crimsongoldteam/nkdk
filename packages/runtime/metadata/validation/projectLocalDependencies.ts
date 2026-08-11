import { parseMetadataTargetFromYAML } from "../ruleRuntime/metadataTarget"
import type { ProjectLocalDependency } from "../projectDefinition/componentIndexFacts"
import type { LocalMetadataTargetFact } from "../projectDefinition/localIndexes"
import {
  projectMemberIndexKey,
  projectObjectIndexKey,
  projectValueIndexKey,
} from "./projectReferenceIndex"

export function projectLocalDependenciesFromFacts(
  sourceProjectPath: string,
  facts: readonly LocalMetadataTargetFact[]
): ProjectLocalDependency[] {
  return facts.flatMap((fact) => {
    const parsed = parseMetadataTargetFromYAML({
      value: fact.value,
      constraint: fact.constraint,
      owner: fact.owner,
    })
    if (!parsed.ok) return []
    const target = parsed.target
    const canonical =
      target.kind === "object"
        ? projectObjectIndexKey(target)
        : target.kind === "member"
          ? projectMemberIndexKey(target)
          : projectValueIndexKey(target)
    return [{
      sourceProjectPath,
      yamlPath: [...fact.yamlPath],
      rulePath: fact.rulePath.map((segment) => ({ ...segment })),
      kind: "metadataTarget" as const,
      canonical,
    }]
  })
}
