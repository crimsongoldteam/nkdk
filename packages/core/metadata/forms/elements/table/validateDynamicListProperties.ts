import type { ParsedYaml } from "@nkdk/runtime"
import type { FormDataPathIndex } from "../../../validation/dataPath/formIndex"
import type { FormYAMLItemVisit } from "../../../validation/dataPath/formYamlTraversal"
import type { Diagnostic } from "../../../validation/types"
import { diagnosticAtYamlPath } from "../../../validation/yamlLocations"
import { dynamicListTableProperties } from "./dynamicListProperties"

export function validateDynamicListTableProperties(params: {
  filePath: string
  parsed: ParsedYaml
  index: FormDataPathIndex
  visit: FormYAMLItemVisit
}): Diagnostic[] {
  if (params.visit.rule.itemType !== "Table") return []

  const explicit = Object.values(dynamicListTableProperties).filter((property) =>
    Object.prototype.hasOwnProperty.call(params.visit.yaml, property.yaml)
  )
  if (explicit.length === 0) return []

  const dataPathRule = params.visit.rule.properties.dataPath
  const dataPath = typeof dataPathRule?.yaml === "string" ? params.visit.yaml[dataPathRule.yaml] : undefined

  let allowed = false
  let unresolvedRoot = false
  if (typeof dataPath === "string" && dataPath.length > 0) {
    const root = params.index.getRoot(dataPath)
    allowed = root?.tableSource?.table.kind === "DynamicList"
    unresolvedRoot = root === undefined && !dataPath.includes(".")
  }
  if (allowed || unresolvedRoot) return []

  return explicit.map((property) =>
    diagnosticAtYamlPath({
      filePath: params.filePath,
      parsed: params.parsed,
      path: [...params.visit.yamlPath, property.yaml],
      severity: "error",
      source: "structure",
      message: `${property.yaml} допустимо только для таблицы динамического списка.`,
    })
  )
}
