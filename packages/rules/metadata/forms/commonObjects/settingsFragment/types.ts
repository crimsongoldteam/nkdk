import { defineMetadataRules } from "../../../ruleRuntime/definition"
import type { MetadataRulesDefinition } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"
import { definePropertyTypeRule, propertyTypesFromContributions } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import type { PropertyRuleType } from "@nkdk/runtime/rule-kit"
import { importContentFromXML, isXmlElementNode, xmlAttributeValue, xmlElementChildren, xmlExport } from "@nkdk/runtime"

/** Настройки уже являются XML-фрагментом в смысловом YAML; вторая модель дерева не нужна. */
export type SettingsFragment = string
export type SettingsFragmentXML = Record<string, unknown> & {
  "_xsi:type"?: string
  [attribute: `_xmlns${string}`]: string | undefined
}
export type SettingsFragmentYAML = string

type SettingsFragmentTypeRegistration = {
  propertyType: PropertyRuleType
  canonicalAttributes: SettingsFragmentXML
  matchXsiType: (xsiType: string) => boolean
}

function normalizeRecord(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeRecord)
  if (value === undefined) return {}
  if (value === null || typeof value !== "object") return value
  if ("_xsi:nil" in value && (value["_xsi:nil"] === true || value["_xsi:nil"] === "true")) return { "_xsi:nil": true }
  return Object.fromEntries(Object.entries(value)
    .filter(([key, item]) => key !== "#text" || typeof item !== "string" || item.trim() !== "")
    .map(([key, item]) => [key, normalizeRecord(item)]))
}

export const defineSettingsFragmentType = <TModel extends SettingsFragment>({
  propertyType, canonicalAttributes, matchXsiType,
}: SettingsFragmentTypeRegistration): MetadataRulesDefinition<never> => {
  const propertyTypes = propertyTypesFromContributions([
    definePropertyTypeRule(propertyType, "importFromXML", (_context, _rule, xml) => {
      if (isXmlElementNode(xml)) {
        const type = xmlAttributeValue(xml, "xsi:type")
        if (type === undefined || !matchXsiType(type)) return undefined
        return xmlExport(xmlElementChildren(xml), false)
      }
      if (xml === null || typeof xml !== "object" || Array.isArray(xml)) return undefined
      const type = "_xsi:type" in xml ? xml["_xsi:type"] : undefined
      if (typeof type !== "string" || !matchXsiType(type)) return undefined
      const body = Object.fromEntries(Object.entries(xml).filter(([key]) => key !== "_xsi:type" && !key.startsWith("_xmlns")))
      return xmlExport(normalizeRecord(body) as Record<string, unknown>, false)
    }),
    definePropertyTypeRule(propertyType, "importFromYAML", (_context, _rule, value) =>
      typeof value === "string" ? value.trim() : undefined),
    definePropertyTypeRule(propertyType, "exportToYAML", (_context, _rule, value: TModel | undefined) => value),
    definePropertyTypeRule(propertyType, "exportToXML", (_context, _rule, value: TModel | undefined) => {
      if (value === undefined) return undefined
      const output = importContentFromXML<{ SettingsFragment?: SettingsFragmentXML }>(
        `<SettingsFragment>${value}</SettingsFragment>`, { preserveXsiNil: true, preserveEmptyElements: true })
      return { ...canonicalAttributes, ...normalizeRecord(output.SettingsFragment) as Record<string, unknown> }
    }),
  ])
  return defineMetadataRules({ ...emptyMetadataRules, propertyTypes })
}
