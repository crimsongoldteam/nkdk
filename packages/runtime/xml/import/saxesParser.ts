import { SaxesParser, type SaxesStartTagPlain, type SaxesTagPlain, type XMLDecl } from "saxes"
import type { ImportContentFromXMLOptions } from "./contracts"
import type {
  XmlAttributeNode,
  XmlDocument,
  XmlDocumentContentNode,
  XmlElementNode,
  XmlProcessingInstructionNode,
  XmlSourceSpan,
} from "./document"
import { hashXmlElementStructure } from "../structure/hash"
import { parseXmlProcessingInstructionAttributes } from "../structure/processingInstruction"

const XML_METADATA = Symbol.for("metadata")
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
  structural: MutableXmlDocument | MutableXmlElementNode
}

interface MutableXmlContainer {
  path: string
  content: XmlDocumentContentNode[]
  textCount: number
  nextContentStart: number
  canMergeText: boolean
}

interface MutableXmlDocument extends MutableXmlContainer {
  kind: "document"
}

interface MutableXmlElementNode extends MutableXmlContainer {
  kind: "element"
  id: number
  name: string
  occurrence: number
  attributes: XmlAttributeNode[]
  spanStart: number
}

const createFrame = (
  name: string,
  structural: MutableXmlDocument | MutableXmlElementNode
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
  const documentStructure: MutableXmlDocument = {
    kind: "document",
    path: "",
    content: [],
    textCount: 0,
    nextContentStart: 0,
    canMergeText: true,
  }
  const document = createFrame("", documentStructure)
  const stack = [document]
  const roots: XmlElementNode[] = []
  let nextNodeId = 1
  const allocateNodeId = (): number => {
    const id = nextNodeId
    nextNodeId += 1
    return id
  }
  const parser = new SaxesParser({ xmlns: false, fragment: !hasXmlDeclaration(data) })

  parser.on("xmldecl", (declaration) => {
    if (data.startsWith("\uFEFF")) document.text = "\uFEFF"
    appendDeclaration(document, declaration)
    advanceContentBoundary(document, parser.position, true)
  })
  parser.on("opentagstart", (tag: SaxesStartTagPlain) => {
    assertSafeName(tag.name)
    const parent = stack.at(-1)
    if (parent === undefined) throw new Error("XML-элемент вне документа")
    const occurrence = (parent.childCounts[tag.name] ?? 0) + 1
    const parentPath = parent.structural.path
    stack.push(
      createFrame(tag.name, {
        kind: "element",
        id: allocateNodeId(),
        name: tag.name,
        occurrence,
        path: `${parentPath}/${tag.name}[${occurrence}]`,
        attributes: [],
        content: [],
        textCount: 0,
        nextContentStart: 0,
        canMergeText: true,
        spanStart: parent.structural.nextContentStart,
      })
    )
  })
  parser.on("attribute", ({ name, value }) => {
    const frame = stack.at(-1)
    const structural = frame?.structural
    if (frame === undefined || structural?.kind !== "element") {
      throw new Error("XML-атрибут вне элемента")
    }
    const occurrence =
      structural.attributes.filter((attribute) => attribute.name === name).length + 1
    structural.attributes.push({
      id: allocateNodeId(),
      name,
      occurrence,
      path: `${structural.path}/@${name}[${occurrence}]`,
      value,
      span: findAttributeSpan(data, parser.position, name),
    })
  })
  parser.on("opentag", (tag: SaxesTagPlain) => {
    const frame = stack.at(-1)
    if (
      frame === undefined ||
      frame.name !== tag.name ||
      frame.structural.kind !== "element"
    ) {
      throw new Error("Несогласованный открывающий XML-тег")
    }
    frame.attributes = tag.attributes
    frame.structural.nextContentStart = parser.position
  })
  parser.on("text", (text) => {
    const frame = stack.at(-1)
    if (frame === undefined) throw new Error("XML-текст вне документа")
    appendText(
      frame,
      text,
      { start: frame.structural.nextContentStart, end: findTextEnd(data, parser.position) },
      allocateNodeId
    )
  })
  parser.on("cdata", (text) => {
    const frame = stack.at(-1)
    if (frame === undefined) throw new Error("CDATA вне документа")
    appendText(
      frame,
      text,
      { start: frame.structural.nextContentStart, end: parser.position },
      allocateNodeId
    )
  })
  parser.on("comment", () => {
    const frame = stack.at(-1)
    if (frame !== undefined) advanceContentBoundary(frame, parser.position + 1, true)
  })
  parser.on("doctype", () => {
    const frame = stack.at(-1)
    if (frame !== undefined) advanceContentBoundary(frame, parser.position, true)
  })
  parser.on("processinginstruction", ({ target, body }) => {
    const attributes: Record<string, string> = {}
    for (const { name, value } of parseXmlProcessingInstructionAttributes(body)) {
      attributes[`_${name}`] = value
    }
    const parent = stack.at(-1)
    if (parent === undefined) throw new Error("XML PI вне документа")
    const key = `?${target}`
    const occurrence = (parent.childCounts[key] ?? 0) + 1
    const span = {
      start: parent.structural.nextContentStart,
      end: parser.position,
    }
    const path = `${parent.structural.path}/${key}[${occurrence}]`
    const node: XmlProcessingInstructionNode = {
      type: "processingInstruction",
      id: allocateNodeId(),
      target,
      occurrence,
      path,
      body,
      span,
      attributes: createProcessingInstructionAttributes(
        data,
        target,
        path,
        span,
        allocateNodeId
      ),
    }
    appendChild(parent, `?${target}`, attributes)
    parent.structural.content.push(node)
    parent.structural.nextContentStart = span.end
  })
  parser.on("closetag", () => {
    const frame = stack.pop()
    const parent = stack.at(-1)
    if (frame === undefined || parent === undefined) throw new Error("Несогласованный стек XML")
    const compatibilityValue = finalizeFrame(frame, options)
    const node = finalizeElement(frame, compatibilityValue, parser.position)
    appendChild(parent, frame.name, compatibilityValue)
    if (parent.structural.kind === "document") roots.push(node)
    parent.structural.content.push(node)
    parent.structural.nextContentStart = node.span.end
  })
  parser.on("error", (error) => {
    throw error
  })
  parser.write(data).close()

  const compatibility = finalizeFrame(document, {
    ...options,
    preserveEmptyElements: true,
  }) as Readonly<Record<string, unknown>>
  return {
    content: documentStructure.content,
    roots,
    compatibility,
    sourceLength: data.length,
  }
}

function appendText(
  frame: ElementFrame,
  text: string,
  span: XmlSourceSpan,
  allocateNodeId: () => number
): void {
  if (frame.structural.kind === "element") frame.text += text
  const { content } = frame.structural
  const previous = content.at(-1)
  if (previous?.type === "text" && frame.structural.canMergeText) {
    content[content.length - 1] = {
      ...previous,
      value: previous.value + text,
      span: { start: previous.span.start, end: span.end },
    }
  } else {
    frame.structural.textCount += 1
    const occurrence = frame.structural.textCount
    content.push({
      type: "text",
      id: allocateNodeId(),
      occurrence,
      path: `${frame.structural.path}/#text[${occurrence}]`,
      value: text,
      span,
    })
  }
  frame.structural.nextContentStart = span.end
  frame.structural.canMergeText = true
}

function finalizeElement(
  frame: ElementFrame,
  compatibilityValue: unknown,
  end: number
): XmlElementNode {
  const structural = frame.structural
  if (structural.kind !== "element") {
    throw new Error("Документная рамка не является XML-элементом")
  }
  const { id, name, occurrence, path, attributes, content, spanStart } = structural
  const partial = {
    type: "element" as const,
    id,
    name,
    occurrence,
    path,
    attributes,
    content,
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

function findAttributeSpan(data: string, parserPosition: number, name: string): XmlSourceSpan {
  const closingQuoteIndex = parserPosition - 1
  const quote = data[closingQuoteIndex]
  if (quote !== '"' && quote !== "'") {
    throw new Error(`Не найдена конечная кавычка атрибута ${name}`)
  }
  const openingQuoteIndex = data.lastIndexOf(quote, closingQuoteIndex - 1)
  const equalsIndex = data.lastIndexOf("=", openingQuoteIndex - 1)
  let nameEnd = equalsIndex
  while (nameEnd > 0 && /\s/u.test(data[nameEnd - 1] ?? "")) nameEnd -= 1
  const start = nameEnd - name.length
  if (data.slice(start, nameEnd) !== name) {
    throw new Error(`Не найдена начальная координата атрибута ${name}`)
  }
  return { start, end: parserPosition }
}

function findTextEnd(data: string, parserPosition: number): number {
  return data[parserPosition - 1] === "<" ? parserPosition - 1 : parserPosition
}

function advanceContentBoundary(frame: ElementFrame, end: number, separatesText: boolean): void {
  frame.structural.nextContentStart = end
  if (separatesText) frame.structural.canMergeText = false
}

function createProcessingInstructionAttributes(
  data: string,
  target: string,
  parentPath: string,
  span: XmlSourceSpan,
  allocateNodeId: () => number
): XmlAttributeNode[] {
  const rawBodyStart = span.start + 2 + target.length
  const rawBody = data.slice(rawBodyStart, span.end - 2)
  const attributes: XmlAttributeNode[] = []
  for (const parsed of parseXmlProcessingInstructionAttributes(rawBody)) {
    const start = rawBodyStart + parsed.start
    attributes.push({
      id: allocateNodeId(),
      name: parsed.name,
      occurrence: parsed.occurrence,
      path: `${parentPath}/@${parsed.name}[${parsed.occurrence}]`,
      value: parsed.value,
      span: { start, end: rawBodyStart + parsed.end },
    })
  }
  return attributes
}
