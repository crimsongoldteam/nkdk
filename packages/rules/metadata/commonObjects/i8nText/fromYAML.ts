import {
  ConfigurationContext,
  markYAMLMappingKeyOrder,
  yamlMappingKeys,
} from "@nkdk/runtime"
import { addDefaultLanguageNameToSynonym } from "../../helpers/synonymHelpers"
import { ImportFromYAMLFunctionNew, PropertyRule } from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { I8nText, I8nTextPropertyRule, I8nTextYAML } from "./types"
import { copyLocalizedItemTags } from "./anomalies"

export const importI8nTextFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: I8nTextYAML | undefined
  source?: I8nText | undefined
  name?: string
  restoreExcludedEqualName?: boolean
}): I8nText | undefined => {
  const { context, rule, value, source, name, restoreExcludedEqualName } = params
  const i8nRule = rule as I8nTextPropertyRule
  if (value === "" && i8nRule.excludeIfEqualNameYAML) return { items: {} }
  if (source === undefined && value === undefined) {
    return restoreExcludedEqualName === true && i8nRule.excludeIfEqualNameYAML && name !== undefined
      ? addDefaultLanguageNameToSynonym(context, undefined, name)
      : undefined
  }

  const result: I8nText = { items: {} }

  if (source !== undefined) {
    result.items = { ...source.items }
    copyLocalizedItemTags(source.items, result.items)
  }

  if (value !== undefined) {
    const otherLanguages = importFromYAML(context, value)!
    const combined = { ...result.items, ...otherLanguages.items }
    copyLocalizedItemTags(result.items, combined)
    copyLocalizedItemTags(otherLanguages.items, combined)
    markYAMLMappingKeyOrder(combined, [
      ...yamlMappingKeys(otherLanguages.items),
      ...yamlMappingKeys(result.items).filter((code) => !Object.hasOwn(otherLanguages.items, code)),
    ])
    result.items = combined
  }

  if (Object.keys(result.items).length === 0) return undefined

  if (i8nRule.excludeIfEqualNameYAML) {
    const defaultLanguage = context.languages.default
    const hasAbsentDefaultMarker = result.items[defaultLanguage] === ""
    if (hasAbsentDefaultMarker) {
      const withoutMarker = Object.fromEntries(
        Object.entries(result.items).filter(([language]) => language !== defaultLanguage),
      )
      copyLocalizedItemTags(result.items, withoutMarker)
      markYAMLMappingKeyOrder(
        withoutMarker,
        yamlMappingKeys(result.items).filter((language) => language !== defaultLanguage),
      )
      result.items = withoutMarker
    }
    if (name === undefined) return result
    if (source !== undefined && source.items[context.languages.default] === undefined) return result
    if (
      hasAbsentDefaultMarker
    ) return result
    const restored = addDefaultLanguageNameToSynonym(context, result, name)
    if (restored.items !== result.items) copyLocalizedItemTags(result.items, restored.items)
    return restored
  }

  return result
}

const importFromYAML = (context: ConfigurationContext, data: I8nTextYAML | undefined): I8nText | undefined => {
  if (data === undefined) return undefined

  if (typeof data === "string") {
    return {
      items: {
        [context.languages.default]: data,
      },
    }
  }

  return {
    items: copyItems(data),
  }
}

function copyItems(items: Record<string, string>): Record<string, string> {
  const copy = { ...items }
  copyLocalizedItemTags(items, copy)
  return copy
}

export const metadataPropertyRule000 = definePropertyTypeRule("I8nText", "importFromYAML", importI8nTextFromYAML)
