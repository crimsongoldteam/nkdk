import { readFile } from "fs/promises"
import { isMap, isScalar, isSeq, parseDocument, Scalar, type Document, type Node } from "yaml"
import { markDoubleQuotedScalar } from "./explicitString"

const scalarToJS = (node: Scalar): unknown => (node.value === null ? undefined : node.value)

const nodeToJS = (node: Node | null | undefined): unknown => {
  if (node === null || node === undefined) return undefined
  if (isScalar(node)) return scalarToJS(node)

  if (isSeq(node)) {
    const result: unknown[] = []
    node.items.forEach((item, index) => {
      const value = nodeToJS(item as Node)
      result.push(value)
      if (isScalar(item) && item.type === Scalar.QUOTE_DOUBLE) markDoubleQuotedScalar(result, index)
    })
    return result
  }

  if (isMap(node)) {
    const result: Record<string, unknown> = {}
    for (const pair of node.items) {
      const keyNode = pair.key
      const valueNode = pair.value
      const keyValue = isScalar(keyNode) ? keyNode.value : nodeToJS(keyNode as Node)
      const key = String(keyValue)
      result[key] = nodeToJS(valueNode as Node)
      if (isScalar(valueNode) && valueNode.type === Scalar.QUOTE_DOUBLE) markDoubleQuotedScalar(result, key)
    }
    return result
  }

  return undefined
}

export const documentToJSWithScalarStyles = <T>(doc: Document): T => {
  return nodeToJS(doc.contents as Node) as T
}

export const importFromYAML = <T>(data: string): T => {
  const doc = parseDocument(data)
  return documentToJSWithScalarStyles<T>(doc)
}

export const importFromYAMLFile = async <T>(filePath: string): Promise<T> => {
  const data = await readFile(filePath, "utf-8")
  return importFromYAML(data)
}
