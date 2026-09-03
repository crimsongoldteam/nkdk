import type { LocalXmlChild, LocalXmlScalar, LocalXmlShape } from "./localProof"
import { xmlObjectOwnAttributes, xmlObjectOwnContent, xmlObjectProcessingInstruction } from "../../../xml/export/document"
import { normalizeXmlElementContent } from "../../../xml/structure/hash"

export function localXmlShapeFromObject(
  name: string,
  value: unknown,
  child?: (name: string, value: unknown, occurrence: number) => LocalXmlChild,
  scalar?: (value: unknown) => LocalXmlScalar | undefined,
): LocalXmlShape {
  let counts: Map<string, number> | undefined
  const content = xmlObjectOwnContent(value).map((descriptor) => {
    if (descriptor.kind === "text") {
      const raw = value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)["#text"] : value
      return { type: "text" as const, ...(scalar?.(raw) ?? { value: descriptor.value }) }
    }
    if (descriptor.name.startsWith("?")) return xmlObjectProcessingInstruction(descriptor.name.slice(1))
    if (child === undefined) throw new Error(`Для XML-ребёнка ${descriptor.name} необходим потребитель`)
    counts ??= new Map()
    const occurrence = (counts.get(descriptor.name) ?? 0) + 1
    counts.set(descriptor.name, occurrence)
    return child(descriptor.name, descriptor.value, occurrence)
  })
  const attributes = xmlObjectOwnAttributes(value).map(attribute => {
    const raw = value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)[`_${attribute.name}`] : undefined
    return { name: attribute.name, ...(scalar?.(raw) ?? { value: attribute.value }) }
  })
  // Общая нормализация читает text.value; компактное подтверждение значения
  // не содержит value и уже представляет значимый исходный текст.
  const normalized = content.some(node => node.type === "text" && node.sourceId !== undefined)
    ? content
    : normalizeXmlElementContent(content as Exclude<(typeof content)[number], { readonly type: "text"; readonly sourceId: number }>[]) as typeof content
  return { name, attributes, content: normalized }
}
