import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { StringOrNumber, StringOrNumberReference } from "./types"

const NUMERIC_XSI_TYPES = new Set(["xs:decimal", "xs:integer", "xs:double", "xs:float"])

type StringOrNumberXML = string | number | { "#text"?: string | number; "_xsi:type"?: string } | undefined

export const importStringOrNumberFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: StringOrNumberXML
): StringOrNumber | StringOrNumberReference | undefined => {
  if (value === undefined) return undefined

  if (typeof value === "object" && value !== null) {
    const text = value["#text"]
    const xsiType = value["_xsi:type"]
    if (text === undefined || text === "") return undefined

    const importedValue =
      typeof xsiType === "string" && NUMERIC_XSI_TYPES.has(xsiType)
        ? Number(text)
        : String(text)

    return context.fromXML.forReference && typeof xsiType === "string"
      ? { value: importedValue, xsiType }
      : importedValue
  }

  return typeof value === "number" ? value : value.toString()
}

registerTypeRule("StringOrNumber", "importFromXML", importStringOrNumberFromXML)
