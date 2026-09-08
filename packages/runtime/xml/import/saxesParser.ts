import { SaxesParser, type SaxesStartTagPlain, type SaxesTagPlain } from "saxes"
import { Buffer } from "node:buffer"
import type {
  XmlAttributeNode,
  XmlDocument,
  XmlDocumentContentNode,
  XmlElementNode,
  XmlProcessingInstructionNode,
  XmlSourceSpan,
} from "./document"
import {
  hashXmlElementStructure,
  normalizeXmlElementContent,
  type XmlStructuralAttribute,
  type XmlStructuralContent,
} from "../structure/hash"
import { parseXmlProcessingInstructionAttributes } from "../structure/processingInstruction"

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

interface ElementFrame {
  name: string
  childCounts: Record<string, number>
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
  childCounts: {},
  structural,
})

export function parseXmlDocumentWithSaxes(data: string): XmlDocument {
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

  parser.on("xmldecl", () => {
    advanceContentBoundary(document, parser.position, true)
  })
  parser.on("opentagstart", (tag: SaxesStartTagPlain) => {
    const name = ownXmlString(tag.name)
    const parent = requireElementParent(stack, tag.name)
    const occurrence = (parent.childCounts[tag.name] ?? 0) + 1
    parent.childCounts[tag.name] = occurrence
    const parentPath = parent.structural.path
    stack.push(
      createFrame(name, {
        kind: "element",
        id: allocateNodeId(),
        name,
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
    name = ownXmlString(name)
    value = ownXmlString(value)
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
    target = ownXmlString(target)
    body = ownXmlString(body)
    const parent = stack.at(-1)
    if (parent === undefined) throw new Error("XML PI вне документа")
    const key = `?${target}`
    const occurrence = (parent.childCounts[key] ?? 0) + 1
    parent.childCounts[key] = occurrence
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
    parent.structural.content.push(node)
    parent.structural.nextContentStart = span.end
  })
  parser.on("closetag", () => {
    const frame = stack.pop()
    const parent = stack.at(-1)
    if (frame === undefined || parent === undefined) throw new Error("Несогласованный стек XML")
    const node = finalizeElement(frame, parser.position)
    if (parent.structural.kind === "document") roots.push(node)
    parent.structural.content.push(node)
    parent.structural.nextContentStart = node.span.end
  })
  parser.on("error", (error) => {
    throw error
  })
  parser.write(data).close()

  return {
    content: documentStructure.content,
    roots,
    sourceLength: data.length,
  }
}

export interface XmlRootStructure {
  readonly path: string
  readonly name: string
  readonly structuralHash: bigint
  readonly span: XmlSourceSpan
}

interface RootStructureFrame {
  readonly name: string
  readonly occurrence: number
  readonly path: string
  readonly spanStart: number
  readonly attributes: XmlStructuralAttribute[]
  readonly content: XmlStructuralContent[]
  readonly childCounts: Map<string, number>
  nextContentStart: number
  canMergeText: boolean
}

/**
 * Вычисляет только структурные хэши XML-корней. В отличие от полного parser
 * уже закрытые поддеревья представлены в родителе одним bigint и сразу
 * освобождаются, поэтому первый проход не удерживает адресное XML-дерево.
 */
export function parseXmlRootStructuresWithSaxes(data: string): {
  readonly roots: readonly XmlRootStructure[]
  readonly sourceLength: number
} {
  const document: RootStructureFrame = {
    name: "",
    occurrence: 1,
    path: "",
    spanStart: 0,
    attributes: [],
    content: [],
    childCounts: new Map(),
    nextContentStart: 0,
    canMergeText: true,
  }
  const stack = [document]
  const roots: XmlRootStructure[] = []
  const parser = new SaxesParser({ xmlns: false, fragment: !hasXmlDeclaration(data) })

  parser.on("xmldecl", () => {
    document.nextContentStart = parser.position
    document.canMergeText = false
  })
  parser.on("opentagstart", (tag: SaxesStartTagPlain) => {
    const parent = requireElementParent(stack, tag.name)
    const occurrence = (parent.childCounts.get(tag.name) ?? 0) + 1
    parent.childCounts.set(tag.name, occurrence)
    stack.push({
      name: tag.name,
      occurrence,
      path: `${parent.path}/${tag.name}[${occurrence}]`,
      spanStart: parent.nextContentStart,
      attributes: [],
      content: [],
      childCounts: new Map(),
      nextContentStart: 0,
      canMergeText: true,
    })
  })
  parser.on("attribute", ({ name, value }) => {
    const frame = stack.at(-1)
    if (frame === undefined || frame === document) throw new Error("XML-атрибут вне элемента")
    frame.attributes.push({ name, value })
  })
  parser.on("opentag", () => {
    const frame = stack.at(-1)
    if (frame === undefined) throw new Error("Несогласованный открывающий XML-тег")
    frame.nextContentStart = parser.position
  })
  const appendStructuralText = (text: string): void => {
    const frame = stack.at(-1)
    if (frame === undefined) throw new Error("XML-текст вне документа")
    const previous = frame.content.at(-1)
    if (previous?.type === "text" && frame.canMergeText) {
      frame.content[frame.content.length - 1] = { type: "text", value: previous.value + text }
    } else {
      frame.content.push({ type: "text", value: text })
    }
    frame.nextContentStart = parser.position
    frame.canMergeText = true
  }
  parser.on("text", appendStructuralText)
  parser.on("cdata", appendStructuralText)
  const splitText = (): void => {
    const frame = stack.at(-1)
    if (frame !== undefined) {
      frame.nextContentStart = parser.position
      frame.canMergeText = false
    }
  }
  parser.on("comment", splitText)
  parser.on("doctype", splitText)
  parser.on("processinginstruction", ({ target, body }) => {
    const frame = stack.at(-1)
    if (frame === undefined) throw new Error("XML PI вне документа")
    frame.content.push({
      type: "processingInstruction",
      target,
      body,
      attributes: parseXmlProcessingInstructionAttributes(body),
    })
    frame.nextContentStart = parser.position
  })
  parser.on("closetag", () => {
    const frame = stack.pop()
    const parent = stack.at(-1)
    if (frame === undefined || frame === document || parent === undefined) {
      throw new Error("Несогласованный стек XML")
    }
    const structuralHash = hashXmlElementStructure({
      ...frame,
      content: normalizeXmlElementContent(frame.content),
    })
    const span = { start: frame.spanStart, end: parser.position }
    parent.content.push({ type: "element", structuralHash })
    parent.nextContentStart = parser.position
    if (parent === document) roots.push({
      path: frame.path,
      name: ownXmlString(frame.name),
      structuralHash,
      span,
    })
  })
  parser.on("error", (error) => { throw error })
  parser.write(data).close()
  return { roots, sourceLength: data.length }
}

function appendText(
  frame: ElementFrame,
  text: string,
  span: XmlSourceSpan,
  allocateNodeId: () => number
): void {
  text = ownXmlString(text)
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
  end: number
): XmlElementNode {
  const structural = frame.structural
  if (structural.kind !== "element") {
    throw new Error("Документная рамка не является XML-элементом")
  }
  const { id, name, occurrence, path, attributes, spanStart } = structural
  const content = normalizeXmlElementContent(structural.content) as XmlDocumentContentNode[]
  const partial = {
    type: "element" as const,
    id,
    name,
    occurrence,
    path,
    attributes,
    content,
    span: { start: spanStart, end },
  }
  return { ...partial, structuralHash: hashXmlElementStructure(partial) }
}

function assertSafeName(name: string): void {
  if (UNSAFE_NAMES.has(name)) throw new Error(`Небезопасное имя XML-элемента: ${name}`)
}

function requireElementParent<T>(stack: readonly T[], name: string): T {
  assertSafeName(name)
  const parent = stack.at(-1)
  if (parent === undefined) throw new Error("XML-элемент вне документа")
  return parent
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
      name: ownXmlString(parsed.name),
      occurrence: parsed.occurrence,
      path: `${parentPath}/@${parsed.name}[${parsed.occurrence}]`,
      value: ownXmlString(parsed.value),
      span: { start, end: rawBodyStart + parsed.end },
    })
  }
  return attributes
}

/** Короткий срез saxes не должен удерживать исходный XML после освобождения дерева. */
function ownXmlString(value: string): string {
  // Копируем кодовые единицы без нормализации Unicode и без сохранения буфера.
  return value.length === 0 ? value : Buffer.from(value, "utf16le").toString("utf16le")
}
