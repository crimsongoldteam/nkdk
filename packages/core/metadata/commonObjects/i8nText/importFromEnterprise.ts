import { ConfigurationContext } from "~/metadata/context/types"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { I8nTextPropertyRule, ImportFromYAMLFunctionNew, PropertyRule } from "~/metadata/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { I8nText, I8nTextEnterprise } from "./types"

export const importI8nTextFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
  value: I8nTextEnterprise | undefined
  source?: I8nText | undefined
  name?: string
}): I8nText | undefined => {
  const { context, rule, value, source, name } = params
  if (source === undefined && value === undefined) return undefined
  const i8nRule = rule as I8nTextPropertyRule<any>

  const result: I8nText = {
    items: {},
  }

  if (source !== undefined) {
    result.items = { ...result.items, ...source.items }
  }

  if (value !== undefined) {
    const otherLanguages = importFromEnterprise(context, value)!
    result.items = { ...result.items, ...otherLanguages.items }
  }

  if (Object.keys(result.items).length === 0) return undefined

  if (i8nRule.excludeIfEqualNameYAML) {
    if (name === undefined) throw new Error("name is required for excludeIfEqualNameYAML")
    return addDefaultLanguageNameToSynonym(context, result, name)
  }

  return result
}

const importFromEnterprise = (
  context: ConfigurationContext,
  data: I8nTextEnterprise | undefined
): I8nText | undefined => {
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

registerTypeRule("I8nText", "importFromEnterprise", importI8nTextFromYAML)
