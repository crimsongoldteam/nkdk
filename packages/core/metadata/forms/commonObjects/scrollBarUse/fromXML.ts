import { ConfigurationContextFromXML } from "../../../context/types"
import { PropertyRule, registerTypeRule } from "../../../orchestration"

type ScrollBarUse = "AutoUse" | "DontUse" | "UseAlways"

const importScrollBarUseFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
): ScrollBarUse | undefined => {
  if (xml === undefined || xml === null) return undefined
  if (xml === true || xml === "true") return "UseAlways"
  if (xml === false || xml === "false") return "DontUse"

  return undefined
}

registerTypeRule("ScrollBarUseBoolean", "importFromXML", importScrollBarUseFromXML)
