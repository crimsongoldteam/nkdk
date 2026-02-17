import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { I8nText, I8nTextEnterprise } from "./types"

export const importI8nTextFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: I8nTextEnterprise | undefined,
  source?: I8nText | undefined
): I8nText | undefined => {
  if (source === undefined && data === undefined) return undefined

  const result: I8nText = {
    items: {},
  }

  if (source !== undefined) {
    result.items = { ...result.items, ...source.items }
  }

  if (data !== undefined) {
    const otherLanguages = importFromEnterprise(context, data)!
    result.items = { ...result.items, ...otherLanguages.items }
  }

  if (Object.keys(result.items).length === 0) return undefined

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

registerTypeRule("I8nText", "importFromEnterprise", importI8nTextFromEnterprise)
