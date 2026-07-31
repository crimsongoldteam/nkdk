import { SaxesParser, type SaxesTagPlain, type XMLDecl } from "saxes"
import type { ImportContentFromXMLOptions } from "../importer"

interface ElementFrame {
  name: string
  attributes: Record<string, string>
  text: string
  children: Record<string, unknown>
}

const createFrame = (name: string, attributes: Record<string, string> = {}): ElementFrame => ({
  name,
  attributes,
  text: "",
  children: {},
})

export function importContentFromXMLWithSaxes<T>(
  data: string,
  options: ImportContentFromXMLOptions = {}
): T {
  const document = createFrame("")
  const stack = [document]
  const parser = new SaxesParser({ xmlns: false })

  parser.on("xmldecl", (declaration) => appendDeclaration(document, declaration))
  parser.on("opentag", (tag: SaxesTagPlain) => stack.push(createFrame(tag.name, tag.attributes)))
  parser.on("text", (text) => appendText(stack, text))
  parser.on("cdata", (text) => appendText(stack, text))
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
  if (!Object.prototype.hasOwnProperty.call(parent.children, name)) {
    parent.children[name] = value
    return
  }

  const previous = parent.children[name]
  if (Array.isArray(previous)) previous.push(value)
  else parent.children[name] = [previous, value]
}

function finalizeFrame(frame: ElementFrame, options: ImportContentFromXMLOptions): unknown {
  const value: Record<string, unknown> = { ...frame.children }
  const attributeEntries = Object.entries(frame.attributes)
  for (const [name, attributeValue] of attributeEntries) value[`_${name}`] = attributeValue
  if (frame.text.length > 0) value["#text"] = frame.text

  const keys = Object.keys(value)
  if (attributeEntries.length === 0 && keys.length === 1 && value["#text"] !== undefined) return value["#text"]
  if (keys.length === 0 && frame.name !== "" && options.preserveEmptyElements !== true) return undefined
  return value
}
