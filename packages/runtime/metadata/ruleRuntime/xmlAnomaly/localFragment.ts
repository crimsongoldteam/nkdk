import type { XmlElementNode } from "../../../xml/import/document"
import type { XmlStructureDifference } from "../../../xml/structure/compare"
import type { LocalXmlChild, LocalXmlProof, LocalXmlScalar } from "./localProof"
import { localXmlShapeFromObject } from "./localShape"

/** Контрольный фрагмент живёт только во время вызова; наружу выходят ID и порядок. */
export function completeLocalXmlFragment(params: {
  readonly source: XmlElementNode
  readonly name: string
  readonly value: unknown
  readonly proof: LocalXmlProof
  readonly childReceipt?: (value: unknown) => LocalXmlChild | undefined
  readonly scalarReceipt?: (value: unknown) => LocalXmlScalar | undefined
  readonly annotate?: (boundary: {
    readonly source: XmlElementNode
    readonly differences: readonly XmlStructureDifference[]
  }) => void
}): LocalXmlChild {
  const visit = (source: XmlElementNode, name: string, value: unknown): LocalXmlChild => {
    // Индекс только непосредственных детей и только у составного фрагмента.
    // Сами XML-узлы не копируются и не изменяются.
    let children: Map<string, XmlElementNode> | undefined
    const actual = localXmlShapeFromObject(name, value, (name, value, occurrence) => {
      const receipt = params.childReceipt?.(value)
      if (receipt !== undefined) return receipt
      children ??= new Map(source.content.flatMap(child => child.type === "element"
        ? [[`${child.name}[${child.occurrence}]`, child] as const] : []))
      const child = children.get(`${name}[${occurrence}]`)
      // Содержимое лишней ветки не влияет на отсутствие её в оригинале.
      // Граница родителя оформляет её подавление вместе с составом и порядком.
      return child === undefined ? { type: "element", name, occurrence } : visit(child, name, value)
    }, params.scalarReceipt)
    return params.proof.check(source, actual, params.annotate === undefined ? undefined
      : differences => params.annotate!({ source, differences }))
  }
  return visit(params.source, params.name, params.value)
}
