import type {
  XmlAttributeNode,
  XmlContentNode,
  XmlElementNode,
  XmlProcessingInstructionNode,
  XmlTextNode,
} from "../import/document"
import { hashXmlElementStructure } from "./hash"
import { validateXmlProcessingInstruction } from "./processingInstruction"

export interface XmlRawMapping {
  readonly [key: string]: XmlRawValue
}

export type XmlRawValue = string | null | readonly XmlRawValue[] | XmlRawMapping

export type XmlPatchValue = XmlRawValue

export interface XmlRawEnvelope {
  readonly semanticValue: unknown
  readonly hasSemanticValue: boolean
  readonly xml: XmlPatchValue
}

export interface XmlRawFragment {
  readonly nodes: readonly XmlElementNode[]
  readonly suppressOrdinaryOutput: boolean
}

export interface DecodeXmlRawValueOptions {
  readonly elementName: string
  readonly suppressOrdinaryOutput?: boolean
  readonly placement?: "value" | "key"
}

export interface XmlRawAttribute {
  readonly name: string
  readonly value: string
}

export interface XmlRawAttributes {
  readonly attributes: readonly XmlRawAttribute[]
  readonly order?: readonly string[]
}

export interface XmlRawOrderPatch {
  readonly order: readonly string[]
  readonly text?: readonly string[]
}

export function decodeXmlRawEnvelope(value: unknown): XmlRawEnvelope {
  if (!isRecord(value)) {
    throw new Error("!xml/raw должен содержать YAML mapping с обязательным $xml")
  }
  for (const key of Object.keys(value)) {
    if (key !== "$значение" && key !== "$xml") {
      throw new Error(`Неизвестное служебное поле !xml/raw: ${key}`)
    }
  }
  if (!Object.prototype.hasOwnProperty.call(value, "$xml")) {
    throw new Error("!xml/raw должен содержать обязательное поле $xml")
  }
  const xml = value["$xml"]
  assertXmlPatchValue(xml, "$xml")
  return {
    semanticValue: value["$значение"],
    hasSemanticValue: Object.prototype.hasOwnProperty.call(value, "$значение"),
    xml,
  }
}

function assertXmlPatchValue(value: unknown, path: string): asserts value is XmlPatchValue {
  if (value === null || typeof value === "string") return
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertXmlPatchValue(item, `${path}[${index}]`))
    return
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      assertXmlPatchValue(item, `${path}.${key}`)
    }
    return
  }
  throw new Error(`${path} принимает только строки, null, массивы и mapping`)
}

export function applyXmlPatch(
  ordinary: Exclude<XmlRawValue, null>,
  patch: XmlPatchValue,
): XmlRawValue {
  if (patch === null || typeof patch === "string" || Array.isArray(patch)) return patch
  if (!isRecord(patch)) throw new Error("XML-поправка должна иметь допустимую YAML-форму")

  const base: Record<string, XmlRawValue> = isRecord(ordinary)
    ? { ...ordinary }
    : { "#text": ordinary }
  for (const [key, patchValue] of Object.entries(patch)) {
    if (patchValue === null) {
      delete base[key]
      continue
    }
    const ordinaryValue = base[key]
    base[key] = ordinaryValue === undefined || ordinaryValue === null
      ? patchValue
      : applyXmlPatch(ordinaryValue, patchValue)
  }
  if (!("#order" in patch)) {
    const contentKeys = Object.keys(base).filter(isXmlContentKey)
    if (contentKeys.length > 0 && contentKeys.every((key) => key in patch)) {
      base["#order"] = Object.keys(patch).filter(isXmlContentKey).flatMap((key) => {
        const value = base[key]
        if (value === undefined || value === null) return []
        return Array.isArray(value) ? value.map(() => key) : [key]
      })
    }
  }
  return base
}

function isXmlContentKey(key: string): boolean {
  return key !== "#name" && key !== "#order" && !key.startsWith("_")
}

export function encodeXmlRawElement(
  element: XmlElementNode,
  defaultName = element.name,
): Exclude<XmlRawValue, null> {
  const attributes: Record<string, XmlRawValue> = {}
  for (const attribute of element.attributes) attributes[`_${attribute.name}`] = attribute.value

  const structured = element.content.filter(
    (node): node is XmlElementNode | XmlProcessingInstructionNode => node.type !== "text",
  )
  const textNodes = element.content.filter(
    (node): node is XmlTextNode => node.type === "text",
  )
  const textValues = textNodes.map(({ value }) => value)
  if (
    element.name === defaultName &&
    structured.length === 0 &&
    element.attributes.length === 0
  ) {
    return textNodes.length === 0 ? {} : textValues.join("")
  }

  const result: Record<string, XmlRawValue> = {
    ...(element.name === defaultName ? {} : { "#name": element.name }),
    ...attributes,
  }
  if (textNodes.length > 0) {
    result["#text"] = textValues.length === 1 ? textValues[0]! : textValues
  }
  const valuesByKey = new Map<string, XmlRawValue[]>()
  const keyOrder: string[] = []
  for (const child of element.content) {
    if (child.type === "text") {
      keyOrder.push("#text")
      continue
    }
    const key = child.type === "element" ? child.name : `?${child.target}`
    const values = valuesByKey.get(key) ?? []
    values.push(
      child.type === "element"
        ? encodeXmlRawElement(child)
        : encodeXmlRawProcessingInstruction(child),
    )
    valuesByKey.set(key, values)
    keyOrder.push(key)
  }
  for (const [key, values] of valuesByKey) {
    result[key] = values.length === 1 ? values[0]! : values
  }
  const canonicalOrder = [
    ...textValues.map(() => "#text"),
    ...[...valuesByKey].flatMap(([key, values]) => values.map(() => key)),
  ]
  if (canonicalOrder.some((key, index) => key !== keyOrder[index])) {
    result["#order"] = keyOrder
  }
  return result
}

function encodeXmlRawProcessingInstruction(
  node: XmlProcessingInstructionNode,
): XmlRawValue {
  const result: Record<string, string> = {}
  for (const attribute of node.attributes) result[`_${attribute.name}`] = attribute.value
  const reconstructed = node.attributes.map(({ name, value }) => `${name}="${value}"`).join(" ")
  if (node.body.trim() !== reconstructed) {
    throw new Error(`Processing instruction ${node.path} нельзя представить raw без потери body`)
  }
  return result
}

interface DraftXmlAttribute {
  readonly name: string
  readonly value: string
}

interface DraftXmlText {
  readonly type: "text"
  readonly value: string
}

interface DraftXmlProcessingInstruction {
  readonly type: "processingInstruction"
  readonly target: string
  readonly body: string
  readonly attributes: readonly DraftXmlAttribute[]
}

interface DraftXmlElement {
  readonly type: "element"
  readonly name: string
  readonly attributes: readonly DraftXmlAttribute[]
  readonly content: readonly DraftXmlContent[]
}

type DraftXmlContent = DraftXmlElement | DraftXmlText | DraftXmlProcessingInstruction

const XML_NAME = /^[:_\p{L}][:_\-.0-9\p{L}\p{M}\p{N}\u00B7]*$/u

export function decodeXmlRawValue(
  value: unknown,
  options: DecodeXmlRawValueOptions
): XmlRawFragment {
  if (options.placement === "key") {
    throw new Error("!xml/raw разрешён только на YAML-значении, но не на ключе")
  }
  assertXmlName(options.elementName, "имя XML-элемента")
  const suppressOrdinaryOutput = options.suppressOrdinaryOutput ?? true
  if (value === null) {
    if (!suppressOrdinaryOutput) {
      throw new Error("!xml/raw null допустим только для известного XML-места")
    }
    return { nodes: [], suppressOrdinaryOutput: true }
  }

  const values = Array.isArray(value) ? value : [value]
  const drafts = values.map((item) => decodeElement(options.elementName, item, true))
  return {
    nodes: materializeXmlElementNodes(drafts),
    suppressOrdinaryOutput,
  }
}

export function decodeXmlRawAttributes(value: unknown): XmlRawAttributes {
  if (!isRecord(value)) {
    throw new Error("Терминал #attributes должен содержать YAML mapping")
  }
  const attributes: XmlRawAttribute[] = []
  let order: readonly string[] | undefined
  for (const [key, item] of Object.entries(value)) {
    if (key === "#order") {
      if (order !== undefined) throw new Error("Служебный ключ #order указан повторно")
      order = decodeXmlRawOrder(item, "порядок атрибутов")
      continue
    }
    if (!key.startsWith("_") || key.length === 1) {
      throw new Error("Терминал #attributes принимает только _-атрибуты и #order")
    }
    if (typeof item !== "string") {
      throw new Error(`Значение XML-атрибута ${key} должно быть строкой`)
    }
    const name = key.slice(1)
    assertXmlName(name, `имя XML-атрибута ${key}`)
    attributes.push({ name, value: item })
  }
  return { attributes, ...(order === undefined ? {} : { order }) }
}

export function decodeXmlRawOrder(value: unknown, description = "#order"): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${description} должен быть YAML-массивом строк`)
  }
  return value as readonly string[]
}

export function decodeXmlRawOrderPatch(value: unknown, description = "#order"): XmlRawOrderPatch {
  if (Array.isArray(value)) return { order: decodeXmlRawOrder(value, description) }
  if (!isRecord(value)) {
    throw new Error(`${description} должен быть YAML-массивом строк или mapping #order/#text`)
  }
  for (const key of Object.keys(value)) {
    if (key !== "#order" && key !== "#text") throw new Error(`Неизвестное поле ${description}: ${key}`)
  }
  const order = decodeXmlRawOrder(value["#order"], `${description}.#order`)
  const rawText = value["#text"]
  const text = typeof rawText === "string"
    ? [rawText]
    : Array.isArray(rawText) && rawText.every((item) => typeof item === "string")
      ? rawText as readonly string[]
      : undefined
  if (text === undefined) throw new Error(`${description}.#text должен быть строкой или YAML-массивом строк`)
  if (order.filter((item) => item === "#text").length !== text.length) {
    throw new Error(`${description}.#order должен содержать по одному #text для каждого текстового фрагмента`)
  }
  return { order, text }
}

export function readdressXmlElementNodes(
  nodes: readonly XmlElementNode[]
): readonly XmlElementNode[] {
  return materializeXmlElementNodes(nodes.map(toDraftElement))
}

function decodeElement(defaultName: string, value: unknown, allowExternalName: boolean): DraftXmlElement {
  if (typeof value === "string") {
    return {
      type: "element",
      name: defaultName,
      attributes: [],
      content: [{ type: "text", value }],
    }
  }
  if (value === null) throw new Error("YAML null разрешён только как корневой payload !xml/raw")
  if (Array.isArray(value)) throw new Error("Вложенная YAML sequence допустима только для повторов XML-детей")
  if (!isRecord(value)) {
    throw new Error("Scalar !xml/raw должен быть строкой; YAML number и boolean запрещены")
  }

  let name = defaultName
  const externalName = value["#name"]
  if (externalName !== undefined) {
    if (!allowExternalName) {
      throw new Error("#name разрешён только на корне raw-значения или у raw-item sequence")
    }
    if (typeof externalName !== "string") throw new Error("#name должен быть строкой")
    assertXmlName(externalName, "#name")
    name = externalName
  }

  const attributes: DraftXmlAttribute[] = []
  let texts: readonly DraftXmlText[] = []
  let textShape: "scalar" | "sequence" | undefined
  const contentByName = new Map<string, readonly DraftXmlContent[]>()
  const canonicalOrder: string[] = []
  let explicitOrder: readonly string[] | undefined

  for (const [key, item] of Object.entries(value)) {
    if (key === "#name") continue
    if (key === "#text") {
      textShape = Array.isArray(item) ? "sequence" : "scalar"
      const values = Array.isArray(item) ? item : [item]
      if (values.some((value) => typeof value !== "string")) {
        throw new Error("#text в !xml/raw должен быть строкой или YAML-массивом строк")
      }
      texts = (values as readonly string[]).map((value) => ({ type: "text", value }))
      contentByName.set("#text", texts)
      canonicalOrder.push(...texts.map(() => "#text"))
      continue
    }
    if (key === "#order") {
      explicitOrder = decodeXmlRawOrder(item)
      continue
    }
    if (key.startsWith("#")) throw new Error(`Неизвестный служебный ключ !xml/raw: ${key}`)
    if (key.startsWith("_")) {
      if (key.length === 1) throw new Error("Имя XML-атрибута после _ не может быть пустым")
      if (typeof item !== "string") {
        throw new Error(`Значение XML-атрибута ${key} должно быть строкой`)
      }
      const attributeName = key.slice(1)
      assertXmlName(attributeName, `имя XML-атрибута ${key}`)
      attributes.push({ name: attributeName, value: item })
      continue
    }
    if (key.toLowerCase() === "?xml") {
      throw new Error("XML-декларация недопустима внутри свойства !xml/raw")
    }
    if (key.toLowerCase().startsWith("!doctype")) {
      throw new Error("DOCTYPE недопустим внутри свойства !xml/raw")
    }

    const children = decodeChildren(key, item)
    contentByName.set(key, children)
    canonicalOrder.push(...children.map(() => key))
  }

  const legacyScalarPrefix =
    explicitOrder !== undefined &&
    textShape === "scalar" &&
    !explicitOrder.includes("#text")
  const order = explicitOrder ?? canonicalOrder
  const orderedContentByName = legacyScalarPrefix
    ? new Map([...contentByName].filter(([name]) => name !== "#text"))
    : contentByName
  assertExactOrder(order, orderedContentByName, "#order")
  const contentOffsets = new Map<string, number>()
  const content: DraftXmlContent[] = legacyScalarPrefix ? [...texts] : []
  for (const contentName of order) {
    const offset = contentOffsets.get(contentName) ?? 0
    content.push(orderedContentByName.get(contentName)![offset]!)
    contentOffsets.set(contentName, offset + 1)
  }
  return { type: "element", name, attributes, content }
}

function decodeChildren(name: string, value: unknown): DraftXmlContent[] {
  if (name.startsWith("?")) {
    const target = name.slice(1)
    if (target.length === 0) throw new Error("Имя processing instruction не может быть пустым")
    assertXmlName(target, "имя processing instruction")
    const values = Array.isArray(value) ? value : [value]
    return values.map((item) => decodeProcessingInstruction(target, item))
  }
  assertXmlName(name, `имя XML-элемента ${name}`)
  const values = Array.isArray(value) ? value : [value]
  return values.map((item) => decodeElement(name, item, false))
}

function decodeProcessingInstruction(
  target: string,
  value: unknown
): DraftXmlProcessingInstruction {
  if (!isRecord(value)) {
    throw new Error(`Processing instruction ?${target} должен содержать mapping атрибутов`)
  }
  const attributes: DraftXmlAttribute[] = []
  for (const [key, item] of Object.entries(value)) {
    if (!key.startsWith("_") || key.length === 1 || typeof item !== "string") {
      throw new Error(`Processing instruction ?${target} принимает только строковые _-атрибуты`)
    }
    const name = key.slice(1)
    assertXmlName(name, `имя атрибута processing instruction ?${target}`)
    attributes.push({ name, value: item })
  }
  const body = attributes.map(({ name, value: item }) => `${name}="${item}"`).join(" ")
  validateXmlProcessingInstruction({ target, body, attributes })
  return { type: "processingInstruction", target, body, attributes }
}

function assertExactOrder(
  order: readonly string[],
  contentByName: ReadonlyMap<string, readonly DraftXmlContent[]>,
  description: string
): void {
  const expectedCounts = new Map(
    [...contentByName].map(([name, content]) => [name, content.length] as const)
  )
  const actualCounts = new Map<string, number>()
  for (const name of order) actualCounts.set(name, (actualCounts.get(name) ?? 0) + 1)
  if (
    order.length !== [...expectedCounts.values()].reduce((sum, count) => sum + count, 0) ||
    [...expectedCounts].some(([name, count]) => actualCounts.get(name) !== count) ||
    [...actualCounts].some(([name]) => !expectedCounts.has(name))
  ) {
    const expected = [...contentByName].flatMap(([name, content]) => content.map(() => name))
    throw new Error(
      `${description} должен ровно перечислять всё XML-содержимое с учётом повторов; `
      + `получено [${order.join(", ")}], содержимое [${expected.join(", ")}]`,
    )
  }
}

function materializeXmlElementNodes(drafts: readonly DraftXmlElement[]): readonly XmlElementNode[] {
  let nextId = 1
  const allocateId = (): number => nextId++
  const occurrences = new Map<string, number>()
  return drafts.map((draft) => {
    const occurrence = (occurrences.get(draft.name) ?? 0) + 1
    occurrences.set(draft.name, occurrence)
    return materializeElement(draft, "", occurrence, allocateId)
  })
}

function materializeElement(
  draft: DraftXmlElement,
  parentPath: string,
  occurrence: number,
  allocateId: () => number
): XmlElementNode {
  const id = allocateId()
  const path = `${parentPath}/${draft.name}[${occurrence}]`
  const attributeOccurrences = new Map<string, number>()
  const attributes: XmlAttributeNode[] = draft.attributes.map((attribute) => {
    const attributeOccurrence = (attributeOccurrences.get(attribute.name) ?? 0) + 1
    attributeOccurrences.set(attribute.name, attributeOccurrence)
    return {
      id: allocateId(),
      name: attribute.name,
      occurrence: attributeOccurrence,
      path: `${path}/@${attribute.name}[${attributeOccurrence}]`,
      value: attribute.value,
      span: { start: 0, end: 0 },
    }
  })

  const elementOccurrences = new Map<string, number>()
  const processingInstructionOccurrences = new Map<string, number>()
  let textOccurrence = 0
  const content: XmlContentNode[] = draft.content.map((node) => {
    if (node.type === "text") {
      textOccurrence += 1
      return {
        type: "text",
        id: allocateId(),
        occurrence: textOccurrence,
        path: `${path}/#text[${textOccurrence}]`,
        value: node.value,
        span: { start: 0, end: 0 },
      } satisfies XmlTextNode
    }
    if (node.type === "processingInstruction") {
      const piOccurrence = (processingInstructionOccurrences.get(node.target) ?? 0) + 1
      processingInstructionOccurrences.set(node.target, piOccurrence)
      const piPath = `${path}/?${node.target}[${piOccurrence}]`
      const pseudoAttributeOccurrences = new Map<string, number>()
      return {
        type: "processingInstruction",
        id: allocateId(),
        target: node.target,
        occurrence: piOccurrence,
        path: piPath,
        body: node.body,
        attributes: node.attributes.map((attribute) => {
          const attributeOccurrence =
            (pseudoAttributeOccurrences.get(attribute.name) ?? 0) + 1
          pseudoAttributeOccurrences.set(attribute.name, attributeOccurrence)
          return {
            id: allocateId(),
            name: attribute.name,
            occurrence: attributeOccurrence,
            path: `${piPath}/@${attribute.name}[${attributeOccurrence}]`,
            value: attribute.value,
            span: { start: 0, end: 0 },
          }
        }),
        span: { start: 0, end: 0 },
      } satisfies XmlProcessingInstructionNode
    }
    const childOccurrence = (elementOccurrences.get(node.name) ?? 0) + 1
    elementOccurrences.set(node.name, childOccurrence)
    return materializeElement(node, path, childOccurrence, allocateId)
  })
  const partial = {
    type: "element" as const,
    id,
    name: draft.name,
    occurrence,
    path,
    attributes,
    content,
    span: { start: 0, end: 0 },
    compatibilityValue: compatibilityValue(attributes, content),
  }
  return { ...partial, structuralHash: hashXmlElementStructure(partial) }
}

function compatibilityValue(
  attributes: readonly XmlAttributeNode[],
  content: readonly XmlContentNode[]
): unknown {
  const value: Record<string, unknown> = {}
  for (const attribute of attributes) value[`_${attribute.name}`] = attribute.value
  const texts = content.filter((node): node is XmlTextNode => node.type === "text")
  if (texts.length > 0) value["#text"] = texts.map(({ value: text }) => text).join("")
  for (const node of content) {
    if (node.type === "text") continue
    const key = node.type === "element" ? node.name : `?${node.target}`
    const nodeValue =
      node.type === "element"
        ? node.compatibilityValue
        : Object.fromEntries(node.attributes.map(({ name, value: item }) => [`_${name}`, item]))
    const previous = value[key]
    if (previous === undefined) value[key] = nodeValue
    else if (Array.isArray(previous)) previous.push(nodeValue)
    else value[key] = [previous, nodeValue]
  }
  const keys = Object.keys(value)
  if (attributes.length === 0 && keys.length === 1 && typeof value["#text"] === "string") {
    return value["#text"]
  }
  return value
}

function toDraftElement(node: XmlElementNode): DraftXmlElement {
  return {
    type: "element",
    name: node.name,
    attributes: node.attributes.map(({ name, value }) => ({ name, value })),
    content: node.content.map((child): DraftXmlContent => {
      if (child.type === "element") return toDraftElement(child)
      if (child.type === "text") return { type: "text", value: child.value }
      return {
        type: "processingInstruction",
        target: child.target,
        body: child.body,
        attributes: child.attributes.map(({ name, value }) => ({ name, value })),
      }
    }),
  }
}

function assertXmlName(value: string, description: string): void {
  if (!XML_NAME.test(value)) throw new Error(`Недопустимое ${description}: ${value}`)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
