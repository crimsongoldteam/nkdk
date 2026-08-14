import { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { FieldsList, FieldsListPropertyRule, FieldsListXML } from "./types"

export const exportFieldsListToXML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: FieldsList | undefined
): FieldsListXML | undefined => {
  if (!data) return undefined
  if (data.length === 0) return {}

  const xmlItem = (rule as FieldsListPropertyRule | undefined)?.fieldsListXMLItem ?? "Field"

  return {
    [xmlItem]: data,
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("FieldsList", "exportToXML", exportFieldsListToXML)
