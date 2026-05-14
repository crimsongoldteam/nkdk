import { isCypherSet, topLevelGraphImportSpecs, type CypherSet } from "@nakidka/core"

export function findCypherSetForYamlProperty(dir: string, yamlKey: string): CypherSet | undefined {
  const spec = topLevelGraphImportSpecs.find((spec) => spec.dir === dir)
  if (!spec) return undefined

  const propertyRule = Object.values(spec.rule.properties).find((rule) => rule.yaml === yamlKey)
  const allowedValues = propertyRule?.allowedValues

  return isCypherSet(allowedValues) ? allowedValues : undefined
}
