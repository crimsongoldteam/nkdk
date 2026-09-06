import { isXmlElementNode, objectRecordOrUndefined, xmlAttributeValue, type XmlElementNode } from "@nkdk/runtime"

/** Читает имя без построения объектного представления структурного XML. */
export function* namedXmlInputs(values: readonly unknown[]): Generator<{
  name: string
  source: XmlElementNode | Record<string, unknown>
  node?: XmlElementNode
}> {
  for (const value of values) {
    if (isXmlElementNode(value)) {
      const name = xmlAttributeValue(value, "name")
      if (name !== undefined) yield { name, source: value, node: value }
    } else {
      const source = objectRecordOrUndefined(value)
      if (typeof source?._name === "string") yield { name: source._name, source }
    }
  }
}
