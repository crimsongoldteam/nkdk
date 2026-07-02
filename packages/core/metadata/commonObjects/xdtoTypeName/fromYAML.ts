import { ConfigurationContext } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"
import { XDTOTypeName, XDTOTypeNameYAML } from "./types"

const isXDTOTypeNameYAML = (value: unknown): value is XDTOTypeNameYAML => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as XDTOTypeNameYAML).ПространствоИмен === "string" &&
    typeof (value as XDTOTypeNameYAML).Имя === "string"
  )
}

export const importXDTOTypeNameFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: XDTOTypeNameYAML | undefined
): XDTOTypeName | undefined => {
  if (value === undefined) return undefined
  if (!isXDTOTypeNameYAML(value)) {
    throw new Error("XDTOTypeName YAML must be an object with ПространствоИмен and Имя")
  }

  return {
    namespace: value.ПространствоИмен,
    name: value.Имя,
  }
}

registerTypeRule("XDTOTypeName", "importFromYAML", importXDTOTypeNameFromYAML)
