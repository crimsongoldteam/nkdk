import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { exportI8nTextToXML } from "../../i8nText/toXML"
import type { I8nText } from "../../i8nText/types"
import type { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "../../../ruleRuntime"
import type { DcsLocalStringValue } from "./types"

export const exportDcsLocalStringTypeToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: DcsLocalStringValue | undefined,
) => {
  if (data === undefined) return undefined
  if ("kind" in data) return { "_xsi:type": "xs:string", "#text": data.text }
  const languages = Object.keys(data.items)
  if (languages.length === 0) return undefined

  const base = exportI8nTextToXML(context, { type: "I8nText" } as PropertyRule, data as I8nText)
  return base === undefined ? undefined : { "_xsi:type": "v8:LocalStringType", ...base }
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "exportToXML",
  exportDcsLocalStringTypeToXML,
)
