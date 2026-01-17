import { CleanContext } from "./types.js"

export const setFormElementId = (context: CleanContext, parsedData: any): any => {
  let idCounter = 1

  function shouldSkipRenumbering(element: any, elementKey?: string): boolean {
    return (
      elementKey === "AutoCommandBar" &&
      element?.["@attributes"]?.id === "-1" &&
      typeof element === "object" &&
      !Array.isArray(element)
    )
  }

  function getElementType(element: any): string | undefined {
    if (typeof element === "object" && element !== null && !Array.isArray(element)) {
      const keys = Object.keys(element).filter((key) => key !== "@attributes" && key !== "#text")
      return keys[0]
    }
    return undefined
  }

  function processValue(value: any, key: string, elementKey?: string): any {
    if (Array.isArray(value)) {
      return value.map((item) => {
        const itemType = getElementType(item)
        return processElement(item, itemType || key)
      })
    }

    if (value && typeof value === "object") {
      if (key === "ChildItems") {
        const result: Record<string, any> = {}
        for (const childKey of Object.keys(value)) {
          const childValue = value[childKey]
          if (Array.isArray(childValue)) {
            result[childKey] = childValue.map((item) => {
              const itemType = getElementType(item)
              return processElement(item, itemType || childKey)
            })
          } else {
            const itemType = getElementType(childValue)
            result[childKey] = processElement(childValue, itemType || childKey)
          }
        }
        return result
      }

      if (key === "Attributes") {
        const result: Record<string, any> = {}
        for (const attrKey of Object.keys(value)) {
          const attrValue = value[attrKey]
          if (Array.isArray(attrValue)) {
            result[attrKey] = attrValue.map((item) => processElement(item, "Attribute"))
          } else {
            result[attrKey] = processElement(attrValue, "Attribute")
          }
        }
        return result
      }

      if (key === "Commands") {
        const result: Record<string, any> = {}
        for (const cmdKey of Object.keys(value)) {
          const cmdValue = value[cmdKey]
          if (Array.isArray(cmdValue)) {
            result[cmdKey] = cmdValue.map((item) => processElement(item, "Command"))
          } else {
            result[cmdKey] = processElement(cmdValue, "Command")
          }
        }
        return result
      }

      return processElement(value, key)
    }

    return value
  }

  function processElement(element: any, elementKey?: string): any {
    if (element === null || element === undefined || typeof element !== "object") {
      return element
    }

    if (Array.isArray(element)) {
      return element.map((item) => {
        const itemType = getElementType(item)
        return processElement(item, itemType)
      })
    }

    const result: Record<string, any> = {}

    if (element["@attributes"]) {
      const attrs = { ...element["@attributes"] }
      if (attrs.id !== undefined && !shouldSkipRenumbering(element, elementKey)) {
        attrs.id = String(idCounter++)
      }
      result["@attributes"] = attrs
    }

    const allKeys = Object.keys(element).filter((key) => key !== "@attributes" && key !== "#text")
    for (const key of allKeys) {
      const value = element[key]
      const processed = processValue(value, key, elementKey)
      if (processed !== undefined) {
        result[key] = processed
      }
    }

    if (element["#text"] !== undefined) {
      result["#text"] = element["#text"]
    }

    return Object.keys(result).length > 0 ? result : element
  }

  if (parsedData && typeof parsedData === "object" && parsedData.Form) {
    return {
      Form: processElement(parsedData.Form, "Form"),
    }
  }

  return processElement(parsedData)
}
