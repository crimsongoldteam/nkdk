import { ConfigurationContext } from "~/metadata/context/types"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { ImportFromYAMLFunctionNew, PropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { I8nText, I8nTextPropertyRule, I8nTextYAML } from "./types"

export const importI8nTextFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: I8nTextYAML | undefined
  source?: I8nText | undefined
  name?: string
}): I8nText | undefined => {
  const { context, rule, value, source, name } = params
  const i8nRule = rule as I8nTextPropertyRule
  if (source === undefined && value === undefined) return undefined

  const result: I8nText = {
    items: {},
  }

  if (source !== undefined) {
    result.items = { ...result.items, ...source.items }
  }

  if (value !== undefined) {
    const otherLanguages = importFromYAML(context, value)!
    result.items = { ...result.items, ...otherLanguages.items }
  }

  if (Object.keys(result.items).length === 0) return undefined

  if (i8nRule.excludeIfEqualNameYAML) {
    if (name === undefined) throw new Error("name is required for excludeIfEqualNameYAML")
    if (source !== undefined && source.items[context.defaultLanguage] === undefined) return result
    return addDefaultLanguageNameToSynonym(context, result, name)
  }

  return result
}

const importFromYAML = (context: ConfigurationContext, data: I8nTextYAML | undefined): I8nText | undefined => {
  if (data === undefined) return undefined

  if (typeof data === "string") {
    return {
      items: {
        [context.defaultLanguage]: data,
      },
    }
  }

  return {
    items: data,
  }
}

registerTypeRule("I8nText", "importFromYAML", importI8nTextFromYAML)
