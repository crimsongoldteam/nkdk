import type { XmlElementNode } from "../../../xml/import/document"
import type { XmlStructureDifference } from "../../../xml/structure/compare"
import type { XmlRawValue } from "../../../xml/structure/rawCodec"

export function createLocalXmlScalarPatch(
  source: XmlElementNode,
  differences: readonly XmlStructureDifference[],
): Record<string, XmlRawValue> {
  const patch: Record<string, XmlRawValue> = {}
  if (differences.length === 0) return patch
  const attributes = new Map(source.attributes.map((attribute) => [attribute.path, attribute]))
  let needsText = false
  for (const difference of differences) {
    const relative = difference.path.slice(source.path.length + 1)
    if (difference.kind === "order" || difference.ownerPath !== source.path || !difference.path.startsWith(`${source.path}/`)) {
      throw unsupportedDifference(difference)
    }
    const attribute = /^@([^/]+)\[\d+\]$/u.exec(relative)
    if (attribute !== null) {
      patch[`_${attribute[1]!}`] = attributes.get(difference.path)?.value ?? null
    } else if (/^#text\[\d+\]$/u.test(relative)) {
      needsText = true
    } else {
      throw unsupportedDifference(difference)
    }
  }
  if (needsText) {
    // Читаем только собственный исходный текст для записи поправки. Значения
    // контрольного XML не нужны: сравнение уже выполнено локальным proof.
    const values = source.content.flatMap((node) => node.type === "text" ? [node.value] : [])
    patch["#text"] = values.length === 0 ? null : values.length === 1 ? values[0]! : values
  }
  return patch
}

function unsupportedDifference(difference: XmlStructureDifference): Error {
  return new Error(`XML-расхождение ${difference.path} не относится к собственным скалярам границы`)
}
