import { parseXmlDocumentWithSaxes, type XmlContentNode } from "@nkdk/runtime"

type FixtureOptions = {
  preserveXsiNil?: true
  preserveEmptyElements?: true
  preserveEmptyElementNames?: readonly string[]
}

/** Только тестовые литералы старых фикстур; производственный импорт читает XML-узлы. */
export function xmlFixtureValue<T>(source: string, options: FixtureOptions = {}): T {
  const document = parseXmlDocumentWithSaxes(source)
  const declaration = source.match(/^\uFEFF?<\?xml\s+([\s\S]*?)\?>/)
  const entries: Array<readonly [string, unknown]> = []
  if (declaration !== null) {
    const attributes = Object.fromEntries([...declaration[1]!.matchAll(/(version|encoding|standalone)\s*=\s*["']([^"']*)["']/g)]
      .map(match => [`_${match[1]}`, match[2]]))
    entries.push(["?xml", attributes])
  }
  for (const node of document.content) {
    if (node.type !== "text") entries.push(nodeEntry(node, options))
  }
  const result = mapping(entries)
  if (declaration !== null && source.startsWith("\uFEFF")) result["#text"] = "\uFEFF"
  return result as T
}

function nodeEntry(node: Exclude<XmlContentNode, { type: "text" }>, options: FixtureOptions): readonly [string, unknown] {
  if (node.type === "processingInstruction") {
    return [`?${node.target}`, Object.fromEntries(node.attributes.map(({ name, value }) => [`_${name}`, value]))]
  }
  const entries = node.content.flatMap(child => child.type === "text" ? [] : [nodeEntry(child, options)])
  const value: Record<string, unknown> | Array<Record<string, unknown>> = node.name === "ChildItems"
    ? entries.map(([key, child]) => ({ [key]: child }))
    : mapping(entries)
  for (const attribute of node.attributes) {
    if (attribute.name !== "xsi:nil" || options.preserveXsiNil) {
      Object.defineProperty(value, `_${attribute.name}`, { value: attribute.value, enumerable: true, configurable: true, writable: true })
    }
  }
  const text = node.content.filter(child => child.type === "text").map(child => child.value).join("")
  if (text !== "") Object.defineProperty(value, "#text", { value: text, enumerable: true, configurable: true, writable: true })
  const keys = Object.keys(value)
  if (!Array.isArray(value) && keys.length === 1 && keys[0] === "#text") return [node.name, text]
  if (keys.length === 0 && !options.preserveEmptyElements && !options.preserveEmptyElementNames?.includes(node.name)) {
    return [node.name, undefined]
  }
  return [node.name, value]
}

function mapping(entries: ReadonlyArray<readonly [string, unknown]>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const counts = new Map<string, number>()
  const childOrder = entries.map(([key, value]) => {
    const index = counts.get(key) ?? 0
    counts.set(key, index + 1)
    if (index === 0) result[key] = value
    else if (index === 1) result[key] = [result[key], value]
    else (result[key] as unknown[]).push(value)
    return { key, index }
  })
  if (childOrder.length > 0) Object.defineProperty(result, Symbol.for("metadata"), { value: { childOrder } })
  return result
}
