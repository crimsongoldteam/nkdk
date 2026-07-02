import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { Diagnostic } from "./types"

interface ValidateUniqueNameScopesParams {
  filePath: string
  parsed: ParsedYaml
  model: MetadataItem
  rule: MetadataItemRule
}

interface NamedItem {
  name?: unknown
}

function metadataItemRecord(model: MetadataItem): Record<string, unknown> {
  return model as MetadataItem & Record<string, unknown>
}

function getNamedCollection(model: MetadataItem, collection: string): readonly NamedItem[] {
  const value = metadataItemRecord(model)[collection]
  return Array.isArray(value) ? value : []
}

function getYamlCollectionName(rule: MetadataItemRule, collection: string): string {
  return rule.properties[collection]?.yaml ?? collection
}

function findYamlKeyPosition(parsed: ParsedYaml, collectionYaml: string, name: string): { line: number; col: number } {
  return parsed.locations.keyPosition([collectionYaml, name]) ?? { line: 1, col: 1 }
}

export function validateUniqueNameScopes({
  filePath,
  parsed,
  model,
  rule,
}: ValidateUniqueNameScopesParams): Diagnostic[] {
  if (!rule.uniqueNameScopes?.length) return []

  const diagnostics: Diagnostic[] = []

  for (const scope of rule.uniqueNameScopes) {
    const seen = new Map<string, string>()

    for (const collection of scope.collections) {
      const collectionYaml = getYamlCollectionName(rule, collection)

      for (const item of getNamedCollection(model, collection)) {
        const name = item.name
        if (typeof name !== "string" || name.length === 0) continue

        const previousCollectionYaml = seen.get(name)
        if (previousCollectionYaml === undefined) {
          seen.set(name, collectionYaml)
          continue
        }

        const position = findYamlKeyPosition(parsed, collectionYaml, name)
        diagnostics.push({
          filePath,
          line: position.line,
          col: position.col,
          message:
            (scope.message ? `${scope.message}: "${name}"` : undefined) ??
            `Имя "${name}" должно быть уникальным в коллекциях ${previousCollectionYaml}, ${collectionYaml}`,
          severity: "error",
          source: "structure",
          path: `/${collectionYaml}/${name}`,
        })
      }
    }
  }

  return diagnostics
}
