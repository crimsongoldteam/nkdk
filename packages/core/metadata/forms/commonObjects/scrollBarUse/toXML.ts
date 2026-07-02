import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { PropertyRule, registerTypeRule } from "../../../orchestration"
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

registerTypeRule("ScrollBarUseBoolean", "exportToXML", exportScrollBarUseToXML)
