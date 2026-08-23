import { SaxesParser, type SaxesStartTagPlain, type SaxesTagPlain, type XMLDecl } from "saxes"
import type { ImportContentFromXMLOptions } from "./contracts"
import type {
  XmlAttributeNode,
  XmlContentNode,
  XmlDocument,
  XmlElementNode,
} from "./document"
import { hashXmlElementStructure } from "../structure/hash"

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
  structural: MutableXmlElementNode | undefined
}

interface MutableXmlElementNode {
  id: number
  name: string
  occurrence: number
  path: string
  attributes: XmlAttributeNode[]
  content: XmlContentNode[]
  spanStart: number
}

const createFrame = (
  name: string,
  structural: MutableXmlElementNode | undefined = undefined
): ElementFrame => ({
  name,
  attributes: {},
  text: "",
  children: {},
  childCounts: {},
  childOrder: [],
  orderedChildren: name === "ChildItems" ? [] : undefined,
  structural,
})

export function parseXmlWithSaxes<T>(data: string, options: ImportContentFromXMLOptions = {}): T {
  return parseXmlDocumentWithSaxes(data, options).compatibility as T
}

export function parseXmlDocumentWithSaxes(
  data: string,
  options: ImportContentFromXMLOptions = {}
): XmlDocument {
  const document = createFrame("")
  const stack = [document]
  const roots: XmlElementNode[] = []
  let nextNodeId = 1
  const parser = new SaxesParser({ xmlns: false, fragment: !hasXmlDeclaration(data) })

  parser.on("xmldecl", (declaration) => {
    if (data.startsWith("\uFEFF")) document.text = "\uFEFF"
    appendDeclaration(document, declaration)
  })
  parser.on("opentagstart", (tag: SaxesStartTagPlain) => {
    assertSafeName(tag.name)
    const parent = stack.at(-1)
    if (parent === undefined) throw new Error("XML-элемент вне документа")
    const occurrence = (parent.childCounts[tag.name] ?? 0) + 1
    const parentPath = parent.structural?.path ?? ""
    stack.push(
      createFrame(tag.name, {
        id: nextNodeId,
        name: tag.name,
        occurrence,
        path: `${parentPath}/${tag.name}[${occurrence}]`,
        attributes: [],
        content: [],
        spanStart: findElementStart(data, parser.position),
      })
    )
    nextNodeId += 1
  })
  parser.on("opentag", (tag: SaxesTagPlain) => {
    const frame = stack.at(-1)
    if (frame === undefined || frame.name !== tag.name || frame.structural === undefined) {
      throw new Error("Несогласованный открывающий XML-тег")
    }
    frame.attributes = tag.attributes
    frame.structural.attributes = Object.entries(tag.attributes).map(([name, value]) => ({
      name,
      value,
    }))
  })
  parser.on("text", (text) => appendText(stack, text))
  parser.on("cdata", (text) => appendText(stack, text))
  parser.on("processinginstruction", ({ target, body }) => {
    const attributes: Record<string, string> = {}
    const structuralAttributes: XmlAttributeNode[] = []
    for (const match of body.matchAll(PI_ATTRIBUTE)) {
      const name = match[1] ?? ""
      const value = match[3] ?? ""
      attributes[`_${name}`] = value
      structuralAttributes.push({ name, value })
    }
    const parent = stack.at(-1)
    if (parent === undefined) throw new Error("XML PI вне документа")
    appendChild(parent, `?${target}`, attributes)
    parent.structural?.content.push({
      type: "processingInstruction",
      target,
      attributes: structuralAttributes,
    })
  })
  parser.on("closetag", () => {
    const frame = stack.pop()
    const parent = stack.at(-1)
    if (frame === undefined || parent === undefined) throw new Error("Несогласованный стек XML")
    const compatibilityValue = finalizeFrame(frame, options)
    const node = finalizeElement(frame, compatibilityValue, parser.position)
    appendChild(parent, frame.name, compatibilityValue)
    if (parent.structural === undefined) roots.push(node)
    else parent.structural.content.push(node)
  })
  parser.on("error", (error) => {
    throw error
  })
  parser.write(data).close()

  const compatibility = finalizeFrame(document, {
    ...options,
    preserveEmptyElements: true,
  }) as Readonly<Record<string, unknown>>
  return { roots, compatibility, sourceLength: data.length }
}

function appendText(stack: ElementFrame[], text: string): void {
  if (stack.length === 1) return
  const current = stack.at(-1)
  if (current === undefined) return
  current.text += text
  const content = current.structural?.content
  if (content === undefined) return
  const previous = content.at(-1)
  if (previous?.type === "text") {
    content[content.length - 1] = { type: "text", value: previous.value + text }
  } else {
    content.push({ type: "text", value: text })
  }
}

function finalizeElement(
  frame: ElementFrame,
  compatibilityValue: unknown,
  end: number
): XmlElementNode {
  const structural = frame.structural
  if (structural === undefined) throw new Error("Документная рамка не является XML-элементом")
  const { spanStart, ...element } = structural
  const partial = {
    type: "element" as const,
    ...element,
    span: { start: spanStart, end },
    compatibilityValue,
  }
  return { ...partial, structuralHash: hashXmlElementStructure(partial) }
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
  if (
    keys.length === 0 &&
    frame.name !== "" &&
    options.preserveEmptyElements !== true &&
    !options.preserveEmptyElementNames?.includes(frame.name)
  ) return undefined
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

function findElementStart(data: string, parserPosition: number): number {
  const start = data.lastIndexOf("<", parserPosition - 1)
  if (start < 0) throw new Error("Не найдена начальная координата XML-элемента")
  return start
}
