import { SaxesParser, type SaxesTagPlain, type XMLDecl } from "saxes"
import type { ImportContentFromXMLOptions } from "../importer"

const XML_METADATA = Symbol.for("metadata")
const PI_ATTRIBUTE = /([^\s=]+)\s*=\s*(["'])([\s\S]*?)\2/gu
const UNSAFE_NAMES = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "hasOwnProperty",
  "toString",
  "valueOf",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
])

type XmlContainer = Record<string, unknown> | Array<Record<string, unknown>>

interface ElementFrame {
  name: string
  attributes: Record<string, string>
  text: string
  children: Record<string, unknown>
  childCounts: Record<string, number>
  childOrder: Array<{ key: string; index: number }>
  orderedChildren: Array<Record<string, unknown>> | undefined
}

const createFrame = (name: string, attributes: Record<string, string> = {}): ElementFrame => ({
  name,
  attributes,
  text: "",
  children: {},
  childCounts: {},
  childOrder: [],
  orderedChildren: name === "ChildItems" ? [] : undefined,
})

export function importContentFromXMLWithSaxes<T>(
  data: string,
  options: ImportContentFromXMLOptions = {}
): T {
  const document = createFrame("")
  const stack = [document]
  const parser = new SaxesParser({ xmlns: false, fragment: !hasXmlDeclaration(data) })

  parser.on("xmldecl", (declaration) => {
    if (data.startsWith("\uFEFF")) document.text = "\uFEFF"
    appendDeclaration(document, declaration)
  })
  parser.on("opentag", (tag: SaxesTagPlain) => {
    assertSafeName(tag.name)
    stack.push(createFrame(tag.name, tag.attributes))
  })
  parser.on("text", (text) => appendText(stack, text))
  parser.on("cdata", (text) => appendText(stack, text))
  parser.on("processinginstruction", ({ target, body }) => {
    const attributes: Record<string, string> = {}
    for (const match of body.matchAll(PI_ATTRIBUTE)) attributes[`_${match[1]}`] = match[3] ?? ""
    const parent = stack.at(-1)
    if (parent === undefined) throw new Error("XML PI вне документа")
    appendChild(parent, `?${target}`, attributes)
  })
  parser.on("closetag", () => {
    const frame = stack.pop()
    const parent = stack.at(-1)
    if (frame === undefined || parent === undefined) throw new Error("Несогласованный стек XML")
    appendChild(parent, frame.name, finalizeFrame(frame, options))
  })
  parser.on("error", (error) => {
    throw error
  })
  parser.write(data).close()

  return finalizeFrame(document, { ...options, preserveEmptyElements: true }) as T
}

function appendText(stack: ElementFrame[], text: string): void {
  if (stack.length === 1) return
  const current = stack.at(-1)
  if (current !== undefined) current.text += text
}

function appendDeclaration(document: ElementFrame, declaration: XMLDecl): void {
  const value: Record<string, string> = {}
  if (declaration.version !== undefined) value._version = declaration.version
  if (declaration.encoding !== undefined) value._encoding = declaration.encoding
  if (declaration.standalone !== undefined) value._standalone = declaration.standalone
  appendChild(document, "?xml", value)
}

function appendChild(parent: ElementFrame, name: string, value: unknown): void {
  const index = parent.childCounts[name] ?? 0
  parent.childCounts[name] = index + 1

  if (parent.orderedChildren !== undefined) {
    parent.orderedChildren.push({ [name]: value })
    return
  }

  parent.childOrder.push({ key: name, index })
  if (!Object.prototype.hasOwnProperty.call(parent.children, name)) {
    parent.children[name] = value
    return
  }

  const previous = parent.children[name]
  if (Array.isArray(previous)) previous.push(value)
  else parent.children[name] = [previous, value]
}

function finalizeFrame(frame: ElementFrame, options: ImportContentFromXMLOptions): unknown {
  const container: XmlContainer = frame.orderedChildren ?? frame.children
  const properties = containerProperties(container)
  let assignedAttributesCount = 0
  for (const [name, attributeValue] of Object.entries(frame.attributes)) {
    if (name === "xsi:nil" && options.preserveXsiNil !== true) continue
    properties[`_${name}`] = attributeValue
    assignedAttributesCount += 1
  }
  if (frame.text.length > 0) properties["#text"] = frame.text

  const keys = Object.keys(container)
  if (
    !Array.isArray(container) &&
    assignedAttributesCount === 0 &&
    keys.length === 1 &&
    properties["#text"] !== undefined
  ) {
    return properties["#text"]
  }
  if (keys.length === 0 && frame.name !== "" && options.preserveEmptyElements !== true) return undefined
  if (frame.orderedChildren === undefined && frame.childOrder.length > 0) {
    Object.defineProperty(container, XML_METADATA, {
      value: { childOrder: frame.childOrder },
      enumerable: false,
    })
  }
  return container
}

const containerProperties = (container: XmlContainer): Record<PropertyKey, unknown> =>
  container as unknown as Record<PropertyKey, unknown>

function assertSafeName(name: string): void {
  if (UNSAFE_NAMES.has(name)) throw new Error(`Небезопасное имя XML-элемента: ${name}`)
}

function hasXmlDeclaration(data: string): boolean {
  return data.startsWith("<?xml") || data.startsWith("\uFEFF<?xml")
}
