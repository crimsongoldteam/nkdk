import type { LocalXmlChild, LocalXmlShape } from "./localProof"
import { xmlObjectOwnAttributes, xmlObjectOwnContent, xmlObjectProcessingInstruction } from "../../../xml/export/document"
import { normalizeXmlElementContent } from "../../../xml/structure/hash"

export function localXmlShapeFromObject(
  name: string,
  value: unknown,
  child?: (name: string, value: unknown, occurrence: number) => LocalXmlChild,
): LocalXmlShape {
  let counts: Map<string, number> | undefined
  const content = xmlObjectOwnContent(value).map((descriptor) => {
    if (descriptor.kind === "text") return { type: "text" as const, value: descriptor.value }
    if (descriptor.name.startsWith("?")) return xmlObjectProcessingInstruction(descriptor.name.slice(1))
    if (child === undefined) throw new Error(`Для XML-ребёнка ${descriptor.name} необходим потребитель`)
    counts ??= new Map()
    const occurrence = (counts.get(descriptor.name) ?? 0) + 1
    counts.set(descriptor.name, occurrence)
    return child(descriptor.name, descriptor.value, occurrence)
  })
  return { name, attributes: xmlObjectOwnAttributes(value), content: normalizeXmlElementContent(content) }
}
