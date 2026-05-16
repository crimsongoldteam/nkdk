import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { XDTOTypeName, XDTOTypeNameXML } from "./types"

type XDTOTypeNameReferenceXML = {
  "#text"?: string | number
  [attribute: string]: string | number | undefined
}

const isReferenceXML = (value: unknown): value is XDTOTypeNameReferenceXML => {
  return value !== null && typeof value === "object" && "#text" in value
}

const hasNamespaceDeclaration = (value: XDTOTypeNameReferenceXML): boolean => {
  return Object.keys(value).some((key) => key.startsWith("_xmlns"))
}

const sanitizeNamespaceReferenceXML = (value: XDTOTypeNameReferenceXML): XDTOTypeNameXML => {
  const result: XDTOTypeNameXML = {
    "#text": value["#text"]!,
  }

  for (const [key, entry] of Object.entries(value)) {
    if (key.startsWith("_xmlns")) {
      result[key as `_xmlns${string}`] = entry
      continue
    }

    if (key !== "#text") {
      Object.defineProperty(result, key, {
        value: undefined,
        enumerable: false,
      })
    }
  }

  return result
}

export const exportXDTOTypeNameToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: XDTOTypeName | undefined,
  referenceValue?: XDTOTypeName | XDTOTypeNameReferenceXML
): XDTOTypeName | XDTOTypeNameXML | XDTOTypeNameReferenceXML | undefined => {
  if (value === undefined) return undefined

  const text = value.toString()
  if (isReferenceXML(referenceValue) && referenceValue["#text"]?.toString() === text && hasNamespaceDeclaration(referenceValue)) {
    return sanitizeNamespaceReferenceXML(referenceValue)
  }

  return text
}

registerTypeRule("XDTOTypeName", "exportToXML", exportXDTOTypeNameToXML)
