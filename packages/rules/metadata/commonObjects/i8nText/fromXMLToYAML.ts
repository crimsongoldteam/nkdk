import { projectNamedXmlCollectionForImport, yamlMappingKeys } from "@nkdk/runtime"
import type { ImportFromXMLToYAMLFunction } from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"

import { localizedItemOccurrences } from "./anomalies"
import { importI8nTextFromXML } from "./fromXML"
import { exportI8nTextToYAML } from "./toYAML"
import type { I8nTextXML } from "./types"

export const importI8nTextFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  rule,
  xml,
  name,
  traversal,
}) => {
  const imported = importI8nTextFromXML(context, rule, xml as I8nTextXML | "" | undefined)
  const exported = exportI8nTextToYAML({ context, rule, value: imported, name })
  if (imported === undefined || (typeof exported !== "object" && !hasRepeatedLanguage(imported.items))) {
    return exported
  }
  if (exported === undefined || exported === null) return exported

  const values = typeof exported === "string"
    ? { [context.languages.default]: exported }
    : exported as Record<string, string>
  const entries = projectedOccurrences(imported.items, values).map(({ language, content }) => ({
    key: language,
    value: content,
    ...(!isServiceLanguage(language) && !context.languages.registeredSet.has(language)
      ? { invalid: true as const }
      : {}),
  }))

  return projectNamedXmlCollectionForImport({
    entries,
    annotations: traversal.annotations,
  })
}

function projectedOccurrences(
  items: Record<string, string>,
  values: Record<string, string>,
): readonly { readonly language: string; readonly content: string }[] {
  const allowed = new Set(Object.keys(values))
  const occurrences = localizedItemOccurrences(items)
    .filter(({ language }) => allowed.has(language))
  const represented = new Set(occurrences.map(({ language }) => language))
  const result = [...occurrences]
  const order = yamlMappingKeys(values)
  for (const language of order) {
    if (represented.has(language)) continue
    const languageIndex = order.indexOf(language)
    const before = result.findIndex((entry) => order.indexOf(entry.language) > languageIndex)
    const occurrence = { language, content: values[language] ?? "" }
    if (before === -1) result.push(occurrence)
    else result.splice(before, 0, occurrence)
    represented.add(language)
  }
  return result
}

function hasRepeatedLanguage(items: Record<string, string>): boolean {
  const seen = new Set<string>()
  return localizedItemOccurrences(items).some(({ language }) => {
    if (seen.has(language)) return true
    seen.add(language)
    return false
  })
}

function isServiceLanguage(language: string): boolean {
  return language === "" || language === "#"
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "I8nText",
  "importFromXMLToYAML",
  importI8nTextFromXMLToYAML,
)
