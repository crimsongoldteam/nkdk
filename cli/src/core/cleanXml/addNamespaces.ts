import type { CleanContext } from "./types.js"

export const addNamespaces = (context: CleanContext, parsedData: any): any => {
  if (!parsedData || typeof parsedData !== "object") {
    return parsedData
  }

  // Находим корневой элемент (первый ключ в объекте)
  const rootKeys = Object.keys(parsedData)
  if (rootKeys.length === 0) {
    return parsedData
  }

  const rootKey = rootKeys[0]
  const rootElement = parsedData[rootKey]

  if (rootElement && typeof rootElement === "object" && !Array.isArray(rootElement)) {
    // Находим первый дочерний элемент внутри корневого элемента (игнорируя @attributes)
    const childKeys = Object.keys(rootElement).filter((key) => key !== "@attributes")
    if (childKeys.length > 0) {
      const firstChildKey = childKeys[0]
      const firstChild = rootElement[firstChildKey]

      if (firstChild && typeof firstChild === "object" && !Array.isArray(firstChild)) {
        // Инициализируем @attributes, если их нет
        if (!firstChild["@attributes"]) {
          firstChild["@attributes"] = {}
        }

        // Объединяем namespace из context.namespaces с существующими атрибутами
        firstChild["@attributes"] = {
          ...firstChild["@attributes"],
          ...context.namespaces,
        }
      }
    }
  }

  return parsedData
}
