import { XMLBuilder } from "fast-xml-parser"

const XML_ORDERED_CHILDREN = Symbol.for("xmlOrderedChildren")

const escapeText = (value: unknown): string =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const escapeAttribute = (value: unknown): string => escapeText(value).replace(/"/g, "&quot;")

const options = {
  attributeNamePrefix: "_",
  ignoreAttributes: false,
  format: true,
  suppressEmptyNode: true,
  suppressBooleanAttributes: false,
  indentBy: "\t",
  oneListGroup: false,
  processEntities: false,
  tagValueProcessor: (_name: string, value: unknown) => escapeText(value),
  attributeValueProcessor: (_name: string, value: unknown) => escapeAttribute(value),
}

const builder = new XMLBuilder(options)
const preserveOrderBuilder = new XMLBuilder({ ...options, preserveOrder: true })

// @ts-ignore
builder.options.attributesGroupName = "@attributes"
// @ts-ignore
preserveOrderBuilder.options.attributesGroupName = "@attributes"

// ВАЖНО: Изменения в библиотеке fast-xml-parser теперь применяются через patch
// См. patches/fast-xml-parser+5.3.3.patch
// При обновлении библиотеки проверьте, что patch применяется корректно

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const getOrderedChildren = (value: unknown): Array<{ key: string; value: unknown }> | undefined => {
  if (!isRecord(value)) return undefined
  const orderedChildren = (value as Record<PropertyKey, unknown>)[XML_ORDERED_CHILDREN]
  if (!Array.isArray(orderedChildren)) return undefined
  return orderedChildren.filter(
    (entry): entry is { key: string; value: unknown } => isRecord(entry) && typeof entry.key === "string"
  )
}

const hasOrderedChildren = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasOrderedChildren)
  if (!isRecord(value)) return false
  if (getOrderedChildren(value) !== undefined) return true
  return Object.values(value).some(hasOrderedChildren)
}

const getAttributeEntries = (value: Record<string, unknown>): Record<string, unknown> => {
  const attributes = Object.fromEntries(Object.entries(value).filter(([key]) => key.startsWith("_")))
  return attributes
}

const objectToPreserveOrderChildren = (value: Record<string, unknown>): unknown[] => {
  const orderedChildren = getOrderedChildren(value)
  const entries =
    orderedChildren?.map(({ key, value: childValue }) => [key, childValue] as const) ??
    Object.entries(value).filter(([key]) => key !== "#text" && !key.startsWith("_"))

  const children: unknown[] = []
  if (value["#text"] !== undefined) {
    children.push({ "#text": value["#text"] })
  }
  for (const [key, childValue] of entries) {
    if (Array.isArray(childValue)) {
      for (const entry of childValue) {
        children.push({ [key]: valueToPreserveOrderChildren(entry), ...attributesToPreserveOrder(entry) })
      }
    } else {
      children.push({ [key]: valueToPreserveOrderChildren(childValue), ...attributesToPreserveOrder(childValue) })
    }
  }
  return children
}

const valueToPreserveOrderChildren = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => valueToPreserveOrderChildren(entry))
  }
  if (isRecord(value)) {
    return objectToPreserveOrderChildren(value)
  }
  return value === undefined ? [] : [{ "#text": value }]
}

const attributesToPreserveOrder = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) return {}
  const attributes = getAttributeEntries(value)
  return Object.keys(attributes).length > 0 ? { ":@": attributes } : {}
}

const toPreserveOrder = (data: Record<string, unknown>): unknown[] =>
  Object.entries(data).map(([key, value]) => ({
    [key]: valueToPreserveOrderChildren(value),
    ...attributesToPreserveOrder(value),
  }))

export const xmlExport = (data: Record<string, any>, addDeclaration: boolean = true): string => {
  const xml = (
    hasOrderedChildren(data) ? preserveOrderBuilder.build(toPreserveOrder(data)) : builder.build(data)
  ).replace(/^\n/, "")
  const declaration = addDeclaration ? '\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n' : ""
  const result = declaration + xml
  return result.trimEnd()
}
