import type { FormDataPathMetadataProjection } from "@nkdk/runtime"
import type { DirectImportFactsSink } from "@nkdk/runtime/rule-kit"
import type { FormDataPathOccurrence } from "../validation/dataPath/formTraversal"
import { yamlPathToPointer } from "@nkdk/runtime"
import type { DataPathPropertyRule } from "@nkdk/runtime/rule-kit"
import { describeFormDataPath, isDataPathRule } from "../validation/dataPath/formYamlTraversal"
import { selectImportPropertyPaths } from "./selectedPropertyFacts"

export function collectFormDataPathOccurrencesFromFacts(params: {
  readonly facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly projection: FormDataPathMetadataProjection
}): Omit<FormDataPathOccurrence, "setValue">[] {
  const paths = new Map<string, readonly (string | number)[]>()
  const selected = new Map<string, {
    fact: typeof params.facts[number]
    rule: DataPathPropertyRule
    value: string
    picture?: string
    multiple?: string
  }>()
  const tables = new Map<string, string>()
  for (const fact of params.facts) {
    const rule = fact.itemRule?.properties[fact.propertyKey]
    if (rule === undefined || !isDataPathRule(rule)) continue
    const value = fact.value
    if (typeof value !== "string" || value.trim().length === 0) continue
    const itemPath = fact.yamlPath.slice(0, -1)
    const request = (propertyKey: string) => {
      const yaml = fact.itemRule?.properties[propertyKey]?.yaml
      if (typeof yaml !== "string") return undefined
      const path = [...itemPath, yaml]
      const key = yamlPathToPointer(path)!
      paths.set(key, path)
      return key
    }
    selected.set(yamlPathToPointer(fact.yamlPath)!, {
      fact, rule, value, picture: request("valuesPicture"), multiple: request("multipleValuesExtendedEdit"),
    })
    if (fact.propertyKey === params.projection.tableDataPathPropertyKey
      && params.projection.tabularElementItemTypes.includes(fact.itemType)) {
      tables.set(yamlPathToPointer(itemPath)!, value)
    }
  }
  const values = selectImportPropertyPaths(params.facts, paths)
  return [...selected.values()].flatMap(({ fact, rule, value, picture, multiple }) => {
    let tableContext: { dataPath: string } | undefined
    for (let length = fact.yamlPath.length - 2; length > 0; length--) {
      const dataPath = tables.get(yamlPathToPointer(fact.yamlPath.slice(0, length))!)
      if (dataPath !== undefined) { tableContext = { dataPath }; break }
    }
    const multipleValue = multiple === undefined ? undefined : values.get(multiple)?.value
    const occurrence = describeFormDataPath({
      rule, value, yamlPath: [...fact.yamlPath], itemType: fact.itemType,
      hasValuesPicture: picture !== undefined && values.has(picture),
      hasMultipleValuesExtendedEdit: multipleValue === true || multipleValue === "Истина",
      tableContext,
    })
    return occurrence === undefined ? [] : [occurrence]
  })
}
