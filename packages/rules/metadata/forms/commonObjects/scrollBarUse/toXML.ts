import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import { ScrollBarUse } from "./types"

const exportScrollBarUseToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: ScrollBarUse | undefined
): boolean | undefined => {
  if (value === undefined || value === "AutoUse") return undefined
  if (value === "DontUse") return false
  if (value === "UseAlways") return true

  return undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("ScrollBarUseBoolean", "exportToXML", exportScrollBarUseToXML)
