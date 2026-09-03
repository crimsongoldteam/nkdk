import type { XmlAddressedNode, XmlElementNode } from "../../../xml/import/document"
import { encodeXmlRawElement, type XmlRawValue } from "../../../xml/structure/rawCodec"
import { xmlContentOrder, type XmlStructureDifference } from "../../../xml/structure/compare"
import type { XmlAnomalyAnnotationTable } from "../../../yaml/xmlAnomalyAnnotations"
import { createLocalXmlScalarPatch } from "./localPatch"
import { annotateXmlRawValue, projectLocalXmlOrder, projectLocalXmlOwnValues } from "./yamlProjection"

interface LocalXmlAnnotationBinding {
  readonly parent: object
  readonly key: string | number
  readonly annotations: XmlAnomalyAnnotationTable
  readonly hasSemanticValue: boolean
}

/** Оформляет уже найденное расхождение свойства, не сравнивая XML повторно. */
export function projectLocalXmlPropertyDifferences(params: LocalXmlAnnotationBinding & {
  readonly source: XmlElementNode
  readonly expectedName: string
  readonly differences: readonly XmlStructureDifference[]
  readonly orderPath: readonly string[]
}): void {
  if (params.differences.length === 0) return
  if (!params.hasSemanticValue) {
    annotateXmlRawValue({ ...params, xml: encodeXmlRawElement(params.source, params.expectedName) })
    return
  }
  const order = params.differences.filter(({ kind }) => kind === "order")
  const own = params.differences.filter(({ kind }) => kind !== "order")
  const rename = own.filter((difference) =>
    difference.kind === "presence" && difference.path === params.source.path,
  )
  const directChildren = new Map(params.source.content.flatMap((node) =>
    node.type === "element" ? [[node.path, node] as const] : [],
  ))
  const children = own.filter((difference) =>
    difference.kind === "presence" && directChildren.has(difference.path),
  )
  const generated = own.filter((difference) => {
    if (difference.kind !== "presence" || !difference.path.startsWith(`${params.source.path}/`)) return false
    const relative = difference.path.slice(params.source.path.length + 1)
    return /^[^/#?]+\[\d+\]$/u.test(relative) && !directChildren.has(difference.path)
  })
  const structural = new Set([...children, ...generated])
  const scalar = own.filter((difference) => difference.path !== params.source.path && !structural.has(difference))
  if (rename.length > 1 || rename.some(({ ownerPath }) => ownerPath !== params.source.path)) {
    throw new Error(`Неоднозначно изменена XML-оболочка ${params.source.path}`)
  }
  const patch: Record<string, XmlRawValue> = {
    ...(rename.length === 0 ? {} : { "#name": params.source.name }),
    ...createLocalXmlScalarPatch(params.source, scalar),
  }
  for (const difference of children) {
    const child = directChildren.get(difference.path)!
    appendPatchValue(patch, child.name, encodeXmlRawElement(child))
  }
  for (const difference of generated) {
    const relative = difference.path.slice(params.source.path.length + 1)
    const name = /^([^/#?]+)\[\d+\]$/u.exec(relative)![1]!
    patch[name] = null
  }
  const changesContent = children.length > 0 || generated.length > 0
  if (changesContent && order.length > 0) patch["#order"] = xmlContentOrder(params.source)
  if (!changesContent && order.length > 0) {
    if (!isRecord(params.parent)) throw new Error("Порядок XML требует mapping-владельца YAML")
    projectLocalXmlOrder({
      yaml: params.parent, annotations: params.annotations, root: params.source,
      differences: order, path: params.orderPath,
    })
  }
  if (Object.keys(patch).length > 0) annotateXmlRawValue({ ...params, xml: patch })
}

/** Скаляр уже сравнен proof; сохраняем только его исходную форму. */
export function projectLocalXmlScalarDifference(params: {
  readonly yaml: Record<string, unknown>
  readonly annotations: XmlAnomalyAnnotationTable
  readonly owner: XmlElementNode
  readonly source: XmlAddressedNode & { readonly value: string }
  readonly difference: XmlStructureDifference
  readonly path?: readonly string[]
}): void {
  if (params.difference.kind !== "value" || params.difference.path !== params.source.path) {
    throw new Error(`XML-расхождение ${params.difference.path} не принадлежит скаляру ${params.source.path}`)
  }
  projectLocalXmlOwnValues({
    yaml: params.yaml, annotations: params.annotations, root: params.owner,
    differences: [params.difference], path: params.path,
  })
}

function isRecord(value: object): value is Record<string, unknown> {
  return !Array.isArray(value)
}

function appendPatchValue(patch: Record<string, XmlRawValue>, key: string, value: Exclude<XmlRawValue, null>): void {
  const previous = patch[key]
  patch[key] = previous === undefined ? value : Array.isArray(previous) ? [...previous, value] : [previous, value]
}
