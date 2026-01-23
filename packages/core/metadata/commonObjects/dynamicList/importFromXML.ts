import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListXML } from "./types"

export const importDynamicListFromXML = (
  _context: ConfigurationContext,
  xml: DynamicListXML | undefined
): DynamicList | undefined => {
  if (!xml) return undefined

  const result = { ...xml } as any

  // Transform _xsi:type to @attributes.xsi:type
  if (result["_xsi:type"]) {
    result["@attributes"] = {
      "xsi:type": result["_xsi:type"],
    }
    delete result["_xsi:type"]
  }

  // Ensure v8:item is always an array when it's a single object
  const normalizeV8Item = (obj: any): any => {
    if (obj === null || obj === undefined) return obj
    if (Array.isArray(obj)) {
      return obj.map(normalizeV8Item)
    }
    if (typeof obj === "object") {
      const normalized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (key === "v8:item" && value && typeof value === "object" && !Array.isArray(value)) {
          normalized[key] = [normalizeV8Item(value)]
        } else {
          normalized[key] = normalizeV8Item(value)
        }
      }
      return normalized
    }
    return obj
  }

  return normalizeV8Item(result) as DynamicList
}
