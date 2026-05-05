import type { ConfigurationContext } from "~/metadata/context/types"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import type { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields } from "./types"

const asArray = <T>(x: T | T[] | undefined): T[] => {
  if (x === undefined) return []
  return Array.isArray(x) ? x : [x]
}

type SelectionItemXML = { "dcsset:field": string }

type SelectionXML = {
  "dcsset:item"?: SelectionItemXML | SelectionItemXML[]
}

/** dcsset:selection — список имён полей данных; в модели `_fieldNames`. */
const importSelectionFromDcsXML = (xml: SelectionXML | undefined): AppearanceFields | undefined => {
  if (!xml) return undefined
  const items = asArray(xml["dcsset:item"])
  if (items.length === 0) return undefined
  const fieldNames = items.map((item) => item["dcsset:field"]).filter(Boolean)
  return { itemType: "AppearanceFields" as const, _fieldNames: fieldNames } as unknown as AppearanceFields
}

const exportSelectionToDcsXML = (fields: AppearanceFields | undefined): SelectionXML | undefined => {
  if (!fields) return undefined
  const fieldNames = (fields as unknown as { _fieldNames?: string[] })._fieldNames
  if (!fieldNames || fieldNames.length === 0) return undefined
  const items: SelectionItemXML[] = fieldNames.map((name) => ({ "dcsset:field": name }))
  return { "dcsset:item": items.length === 1 ? items[0] : items }
}

/** Ключ «Поля» — массив строк в YAML условного оформления. */
const importSelectionFromYAML = (value: unknown): AppearanceFields | undefined => {
  if (!value) return undefined
  const names = Array.isArray(value) ? value.map(String) : [String(value)]
  return { itemType: AppearanceFieldsRules.itemType, _fieldNames: names } as unknown as AppearanceFields
}

const exportSelectionToYAML = (fields: AppearanceFields | undefined): string[] | undefined => {
  if (!fields) return undefined
  const names = (fields as unknown as { _fieldNames?: string[] })._fieldNames
  return names && names.length > 0 ? names : undefined
}

registerTypeRule(
  "AppearanceFields",
  "importFromXML",
  (_context: ConfigurationContextFromXML, _rule: PropertyRule | undefined, xml: unknown) =>
    importSelectionFromDcsXML(xml as SelectionXML | undefined)
)

registerTypeRule(
  "AppearanceFields",
  "exportToXML",
  (_context: ConfigurationContextWithExportToXML, _rule: PropertyRule | undefined, value: unknown, _reference?: unknown) =>
    exportSelectionToDcsXML(value as AppearanceFields | undefined)
)

registerTypeRule("AppearanceFields", "importFromYAML", (_context: ConfigurationContext, _rule: PropertyRule | undefined, yaml: unknown) =>
  importSelectionFromYAML(yaml)
)

registerTypeRule("AppearanceFields", "exportToYAML", (_context: ConfigurationContext, _rule: PropertyRule | undefined, data: unknown) =>
  exportSelectionToYAML(data as AppearanceFields | undefined)
)
