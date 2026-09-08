import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { PropertyRule } from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { StringOrNumber } from "./types"

export const exportStringOrNumberToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: StringOrNumber | undefined
): StringOrNumber | undefined => value

export const metadataPropertyRule000 = definePropertyTypeRule("StringOrNumber", "exportToXML", exportStringOrNumberToXML)
