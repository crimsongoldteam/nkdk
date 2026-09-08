import { projectNamedXmlCollectionForImport, yamlMappingKeys, xmlElementChildren, type XmlElementNode, type XmlImportAuditSession } from "@nkdk/runtime"
import {
  importPropertyFromXML,
  type ImportFromXMLToYAMLFunction,
  type PropertyRuleExecution,
} from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"

import { localizedItemOccurrences } from "./anomalies"
import { importI8nTextFromXML } from "./fromXML"
import { exportI8nTextToYAML } from "./toYAML"

export const importI8nTextFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  rule,
  xml,
  name,
  traversal,
}) => {
  const source = traversal.xmlNodes?.[0]
  if (source !== undefined) claimLocalizedXML(source, traversal.audit)
  const imported = importPropertyFromXML({
    context,
    rule,
    value: source ?? xml,
    name,
    execution: traversal.execution as PropertyRuleExecution | undefined,
  }) as ReturnType<typeof importI8nTextFromXML>
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
    ...(traversal.mode === "facts" ? { ephemeral: true as const } : {}),
  })
}

function claimLocalizedXML(root: XmlElementNode, audit: XmlImportAuditSession | undefined): void {
  if (audit === undefined) return
  const boundaries = audit.getOutcome(root).boundaries
  if (boundaries.length !== 1) return
  const boundary = boundaries[0]!
  for (const item of xmlElementChildren(root, "v8:item")) {
    audit.claim(item, boundary)
    for (const name of ["v8:lang", "v8:content"]) {
      const value = xmlElementChildren(item, name)[0]
      if (value === undefined) continue
      audit.claim(value, boundary)
      for (const child of value.content) {
        if (child.type === "text") audit.claim(child, boundary)
      }
    }
  }
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
