import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import type { UserVisible, UserVisibleXML } from "./types"

export const exportUserVisibleToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  userVisible: UserVisible | undefined
): UserVisibleXML | undefined => {
  if (!userVisible) return undefined

  const result: UserVisibleXML = {
    "xr:Common": userVisible.common,
    "xr:Value": userVisible.values.map((item) => ({
      _name: item.name,
      "#text": item.value,
    })),
  }

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserVisible", "exportToXML", exportUserVisibleToXML)
