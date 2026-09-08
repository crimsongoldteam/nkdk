import type { DirectImportFactsSink } from "@nkdk/runtime/rule-kit"
import { describeFormElementDataPath, type FormDataPathPreparation } from "../forms/clientApplicationForm/formDataPathContext"
import { yamlPathToPointer } from "@nkdk/runtime"
import { isDataPathRule, primaryFormDataPathRule } from "../validation/dataPath/formYamlTraversal"
import { clientApplicationFormDataPathProjection } from "../forms/clientApplicationForm/formDataPathProjection"
import { isMainFormAttribute } from "../forms/clientApplicationForm/mainAttributeKinds"
import { selectImportPropertyPaths } from "./selectedPropertyFacts"

export function selectFormDataPathPreparationFacts(
  facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): typeof facts {
  return facts.filter(fact => {
    if (fact.propertyKey === "$formElementKind") return true
    const key = fact.propertyKey.startsWith("$container:") ? fact.propertyKey.slice(11) : fact.propertyKey
    if (key === "mainAttribute") return fact.itemType === clientApplicationFormDataPathProjection.attributeItemType
    if (key === "valuesPicture" || key === "multipleValuesExtendedEdit") return true
    const rule = fact.itemRule?.properties[key]
    return rule !== undefined && isDataPathRule(rule)
  })
}

export function collectFormDataPathPreparationFromFacts(params: {
  readonly facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly index: FormDataPathPreparation["index"]
  readonly yamlPathPrefix?: readonly (string | number)[]
}): FormDataPathPreparation {
  const prefix = params.yamlPathPrefix ?? []
  const elements = new Map<string, {
    name: string
    yamlPath: (string | number)[]
    fact: typeof params.facts[number]
    pathKey: string
    yamlKey: string
  }>()
  const paths = new Map<string, readonly (string | number)[]>()
  const tables = new Map<string, { name: string; yamlPath: (string | number)[] }>()
  let effectiveMainAttribute: string | undefined
  for (const fact of params.facts) {
    if (!prefix.every((segment, index) => fact.yamlPath[index] === segment)) continue
    if (fact.propertyKey === "mainAttribute" && fact.itemType === clientApplicationFormDataPathProjection.attributeItemType
      && effectiveMainAttribute === undefined && isMainFormAttribute(fact.value)) {
      const name = fact.yamlPath.at(-2)
      if (typeof name === "string") effectiveMainAttribute = name
    }
    if (fact.propertyKey !== "$formElementKind" || fact.itemRule === undefined) continue
    const yamlPath = fact.yamlPath.slice(prefix.length, -1)
    const name = yamlPath.at(-1)
    if (typeof name !== "string") continue
    const ownerKey = yamlPathToPointer(yamlPath)!
    if (clientApplicationFormDataPathProjection.tabularElementItemTypes.some(type => type === fact.itemType)) {
      tables.set(ownerKey, { name, yamlPath })
    }
    const rule = primaryFormDataPathRule(fact.itemRule)
    if (typeof rule?.yaml !== "string") continue
    const path = [...prefix, ...yamlPath, rule.yaml]
    const pathKey = yamlPathToPointer(path)!
    paths.set(pathKey, path)
    elements.set(ownerKey, { name, yamlPath, fact, pathKey, yamlKey: rule.yaml })
  }
  const values = selectImportPropertyPaths(params.facts, paths)
  const elementsByName = new Map<string, NonNullable<ReturnType<typeof describeFormElementDataPath>>>()
  for (const { name, yamlPath, fact, pathKey, yamlKey } of elements.values()) {
    let tableOwner: { name: string; yamlPath: (string | number)[] } | undefined
    for (let length = yamlPath.length - 1; length > 0; length--) {
      tableOwner = tables.get(yamlPathToPointer(yamlPath.slice(0, length))!)
      if (tableOwner !== undefined) break
    }
    const element = describeFormElementDataPath({
      name, yamlPath, rule: fact.itemRule!, itemType: fact.itemType, tableOwner,
      primaryDataPath: { yamlKey, present: values.has(pathKey), value: values.get(pathKey)?.value },
    })
    if (element !== undefined) elementsByName.set(name, element)
  }
  return {
    index: params.index, collected: { elementsByName },
    ...(effectiveMainAttribute === undefined ? {} : { effectiveMainAttribute }),
  }
}
