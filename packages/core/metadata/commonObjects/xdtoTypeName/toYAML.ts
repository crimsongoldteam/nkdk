import { ConfigurationContext } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"
import { XDTOTypeName, XDTOTypeNameYAML } from "./types"

export const exportXDTOTypeNameToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: XDTOTypeName | undefined
): XDTOTypeNameYAML | undefined => {
  if (value === undefined) return undefined

  return {
    ПространствоИмен: value.namespace,
    Имя: value.name,
  }
}

registerTypeRule("XDTOTypeName", "exportToYAML", exportXDTOTypeNameToYAML)
