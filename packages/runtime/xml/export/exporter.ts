import { XMLBuilder } from "fast-xml-parser"
import type { XmlContentNode, XmlElementNode } from "../import/document"
import { isXmlElementNode } from "../import/document"
import { validateXmlProcessingInstruction } from "../structure/processingInstruction"

export const XML_ORDERED_CHILDREN = Symbol.for("xmlOrderedChildren")
const STRUCTURAL_CONTENT = Symbol("structuralContent")

const escapeText = (value: unknown): string =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const escapeAttribute = (value: unknown): string =>
  escapeText(value)
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "&#xA;")
    .replace(/\r/g, "&#xD;")
    .replace(/\t/g, "&#x9;")

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
const compactPreserveOrderBuilder = new XMLBuilder({
  ...options,
  format: false,
  preserveOrder: true,
})

// @ts-ignore
builder.options.attributesGroupName = "@attributes"
// @ts-ignore
preserveOrderBuilder.options.attributesGroupName = "@attributes"
// @ts-ignore
compactPreserveOrderBuilder.options.attributesGroupName = "@attributes"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

export const getXmlOrderedChildren = (value: unknown): Array<{ key: string; value: unknown }> | undefined => {
  if (!isRecord(value)) return undefined
  const orderedChildren = (value as Record<PropertyKey, unknown>)[XML_ORDERED_CHILDREN]
  if (!Array.isArray(orderedChildren)) return undefined
  return orderedChildren.filter(
    (entry): entry is { key: string; value: unknown } => isRecord(entry) && typeof entry.key === "string"
  )
}

const hasOrderedChildren = (value: unknown): boolean => {
  if (isXmlElementNode(value)) return true
  if (Array.isArray(value)) return value.some(hasOrderedChildren)
  if (!isRecord(value)) return false
  if (getXmlOrderedChildren(value) !== undefined) return true
  return Object.values(value).some(hasOrderedChildren)
}

const CHILD_ITEMS_XML_TAG = "ChildItems"

const toOrderedChildItemsNode = (items: unknown[]): Record<PropertyKey, unknown> => {
  const orderedChildren = items.flatMap((item): Array<{ key: string; value: unknown }> => {
    if (!isRecord(item)) return []
    return Object.entries(item).map(([key, value]) => ({ key, value }))
  })

  return { [XML_ORDERED_CHILDREN]: orderedChildren }
}

/** Только оболочка непосредственного свойства; содержимое детей не обходится. */
export const normalizeXmlChildForExport = (key: string, value: unknown): unknown =>
  key === CHILD_ITEMS_XML_TAG && Array.isArray(value) ? toOrderedChildItemsNode(value) : value

export const normalizeXmlObjectForExport = (value: unknown): unknown => {
  if (isXmlElementNode(value)) return value
  if (Array.isArray(value)) {
    return value.map((item) => normalizeXmlObjectForExport(item))
  }

  if (!isRecord(value)) return value

  const normalizedValue: Record<PropertyKey, unknown> = Object.fromEntries(
    Object.entries(value).map(([key, childValue]) => [
      key,
      normalizeXmlChildForExport(key, normalizeXmlObjectForExport(childValue)),
    ])
  )

  const orderedChildren = getXmlOrderedChildren(value)
  if (orderedChildren !== undefined) {
    normalizedValue[XML_ORDERED_CHILDREN] = orderedChildren.map(({ key, value: childValue }) => ({
      key,
      value: normalizeXmlObjectForExport(childValue),
    }))
  }

  return normalizedValue
}

const getAttributeEntries = (value: Record<string, unknown>): Record<string, unknown> => {
  const attributes = Object.fromEntries(Object.entries(value).filter(([key]) => key.startsWith("_")))
  return attributes
}

const objectToPreserveOrderChildren = (value: Record<string, unknown>): unknown[] => {
  const orderedChildren = getXmlOrderedChildren(value)
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
  if (isXmlElementNode(value)) return value.content.map(structuralContentToPreserveOrder)
  if (Array.isArray(value)) {
    return value.flatMap((entry) => valueToPreserveOrderChildren(entry))
  }
  if (isRecord(value)) {
    return objectToPreserveOrderChildren(value)
  }
  return value === undefined ? [] : [{ "#text": value }]
}

const attributesToPreserveOrder = (value: unknown): Record<string, unknown> => {
  if (isXmlElementNode(value)) return structuralAttributesToPreserveOrder(value)
  if (!isRecord(value)) return {}
  const attributes = getAttributeEntries(value)
  return Object.keys(attributes).length > 0 ? { ":@": attributes } : {}
}

const toPreserveOrder = (data: Record<string, unknown>): unknown[] =>
  Object.entries(data).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value]).map(entry => ({
      [key]: valueToPreserveOrderChildren(entry),
      ...attributesToPreserveOrder(entry),
    })),
  )

const structuralAttributesToPreserveOrder = (
  node: Pick<XmlElementNode, "attributes">
): Record<PropertyKey, unknown> => ({
  [STRUCTURAL_CONTENT]: true,
  ...(node.attributes.length === 0
    ? {}
    : {
        ":@": Object.fromEntries(
          node.attributes.map(({ name, value }) => [`_${name}`, value])
        ),
      }),
})

const structuralContentToPreserveOrder = (node: XmlContentNode): Record<string, unknown> => {
  if (node.type === "text") return { "#text": node.value }
  if (node.type === "processingInstruction") {
    validateXmlProcessingInstruction(node)
    const separator = node.body.length === 0 ? "" : " "
    return { [`?${node.target}${separator}${node.body}`]: [] }
  }
  return structuralElementToPreserveOrder(node)
}

const structuralElementToPreserveOrder = (node: XmlElementNode): Record<string, unknown> => ({
  [node.name]: node.content.map(structuralContentToPreserveOrder),
  ...structuralAttributesToPreserveOrder(node),
})

/** Общее форматирование готового выхода: компактны только смешанные поддеревья. */
const buildOrderedXml = (nodes: readonly unknown[]): string => {
  const occupiedElementNames = new Set<string>()
  const opaquePayloads: string[] = []
  const collectPlaceholderCollisions = (node: unknown): void => {
    if (!isRecord(node)) return
    for (const [key, value] of Object.entries(node)) {
      if (key === ":@" && isRecord(value)) {
        opaquePayloads.push(...Object.values(value).map(String))
      } else if (Array.isArray(value)) {
        occupiedElementNames.add(key)
        if (key.startsWith("?")) opaquePayloads.push(key)
        for (const child of value) collectPlaceholderCollisions(child)
      } else {
        opaquePayloads.push(String(value))
      }
    }
  }
  for (const node of nodes) collectPlaceholderCollisions(node)

  const replacements: Array<{ readonly tag: string; readonly xml: string }> = []
  let placeholderIndex = 1
  const nextPlaceholderTag = (): string => {
    let tag: string
    do {
      tag = `nkdkXmlMixedContent${placeholderIndex}`
      placeholderIndex += 1
    } while (
      occupiedElementNames.has(tag) ||
      opaquePayloads.some((payload) => payload.includes(`<${tag}/>`))
    )
    occupiedElementNames.add(tag)
    return tag
  }

  const withPlaceholders = (node: unknown): unknown => {
    if (!isRecord(node)) return node
    const entry = Object.entries(node).find(([key, value]) => key !== ":@" && Array.isArray(value))
    if (entry === undefined) return node
    const [name, content] = entry
    if (!Array.isArray(content)) return node
    const hasText = content.some(child => isRecord(child) && Object.hasOwn(child, "#text"))
    const hasChild = content.some(child => isRecord(child) && !Object.hasOwn(child, "#text"))
    if (hasText && hasChild && STRUCTURAL_CONTENT in node) {
      const tag = nextPlaceholderTag()
      replacements.push({
        tag,
        xml: compactPreserveOrderBuilder.build([node]),
      })
      return { [tag]: [] }
    }
    return { ...node, [name]: content.map(withPlaceholders) }
  }

  let xml = preserveOrderBuilder.build(nodes.map(withPlaceholders))
  for (const replacement of replacements) {
    const placeholder = `<${replacement.tag}/>`
    const position = xml.indexOf(placeholder)
    const duplicatePosition = xml.indexOf(
      placeholder,
      position + placeholder.length,
    )
    if (position < 0 || duplicatePosition >= 0) {
      throw new Error(
        `Служебный XML-placeholder ${replacement.tag} не является однозначным`,
      )
    }
    xml =
      xml.slice(0, position) +
      replacement.xml +
      xml.slice(position + placeholder.length)
  }
  return xml
}

export const xmlExport = (
  data: Record<string, any> | readonly XmlElementNode[],
  addDeclaration: boolean = true
): string => {
  const xml = Array.isArray(data)
    ? buildOrderedXml(data.map(structuralElementToPreserveOrder))
    : buildObjectXml(data)
  const declaration = addDeclaration ? '\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n' : ""
  const result = declaration + xml.replace(/^\n/, "")
  return result.trimEnd()
}

const buildObjectXml = (data: Record<string, any>): string => {
  const normalizedData = normalizeXmlObjectForExport(data) as Record<string, any>
  const xml = (
    hasOrderedChildren(normalizedData)
      ? buildOrderedXml(toPreserveOrder(normalizedData))
      : builder.build(normalizedData)
  ).replace(/^\n/, "")
  return xml
}
