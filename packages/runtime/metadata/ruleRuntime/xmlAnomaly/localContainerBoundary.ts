import type { XmlElementNode } from "../../../xml/import/document"
import type { XmlStructureDifference } from "../../../xml/structure/compare"
import type { XmlAnomalyAnnotationTable } from "../../../yaml/xmlAnomalyAnnotations"
import type { LocalXmlChild, LocalXmlProof, LocalXmlShape } from "./localProof"
import { projectLocalXmlOrder, projectLocalXmlOwnValues } from "./yamlProjection"

/** Дети уже завершены: здесь только собственные значения, состав и порядок. */
export function completeLocalXmlContainerBoundary(params: {
  readonly source: XmlElementNode
  readonly actual: LocalXmlShape
  readonly proof: LocalXmlProof
  readonly yaml: Record<string, unknown>
  readonly annotations: XmlAnomalyAnnotationTable
  readonly path?: readonly string[]
  readonly childPresence?: (child: {
    readonly source: XmlElementNode | undefined
    readonly name: string
    readonly occurrence: number
  }) => void
}): LocalXmlChild {
  return params.proof.check(params.source, params.actual, (differences) => {
    const own: XmlStructureDifference[] = []
    let children: Map<string, XmlElementNode> | undefined
    for (const difference of differences) {
      if (difference.kind === "order") continue
      if (difference.ownerPath !== params.source.path || !difference.path.startsWith(`${params.source.path}/`)) {
        throw new Error(`Не подготовлена XML-оболочка: ${difference.path}`)
      }
      const relative = difference.path.slice(params.source.path.length + 1)
      if (relative.startsWith("@") || relative.startsWith("#text[")) {
        own.push(difference)
        continue
      }
      const child = /^([^/#?]+)\[(\d+)\]$/u.exec(relative)
      if (difference.kind !== "presence" || child === null || params.childPresence === undefined) {
        throw new Error(`Не подготовлена локальная XML-граница: ${difference.path}`)
      }
      children ??= new Map(params.source.content.flatMap((node) => node.type === "element" ? [[node.path, node] as const] : []))
      params.childPresence({ source: children.get(difference.path), name: child[1]!, occurrence: Number(child[2]) })
    }
    const projection = {
      yaml: params.yaml, annotations: params.annotations, root: params.source, path: params.path,
    }
    projectLocalXmlOwnValues({ ...projection, differences: own })
    projectLocalXmlOrder({ ...projection, differences })
  })
}
