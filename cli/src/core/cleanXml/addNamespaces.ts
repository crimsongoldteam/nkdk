import type { CleanContext } from "./types.js"

export const addNamespaces = (context: CleanContext, parsedData: any): any => {
  if (!Array.isArray(parsedData)) {
    return parsedData
  }

  // Находим корневой элемент (не декларацию)
  const rootElement = parsedData.find((item) => {
    const keys = Object.keys(item)
    return keys.some((k) => !k.startsWith("?") && k !== ":@")
  })

  if (rootElement) {
    // Инициализируем атрибуты, если их нет
    if (!rootElement[":@"]) {
      rootElement[":@"] = {}
    }

    // Объединяем namespace из context.namespaces с существующими атрибутами
    rootElement[":@"] = {
      ...context.namespaces,
    }
  }

  return parsedData
}
