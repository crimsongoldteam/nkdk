import type { XmlElementNode } from "../../../xml/import/document"
import type { XmlAnomalyAnnotationTable } from "../../../yaml/xmlAnomalyAnnotations"
import type { LocalXmlChild, LocalXmlProof, LocalXmlShape } from "./localProof"
import { encodeXmlRawElement, type XmlRawValue } from "../../../xml/structure/rawCodec"
import { createLocalXmlScalarPatch } from "./localPatch"
import { annotateXmlRawValue } from "./yamlProjection"

export function completeLocalXmlScalarBoundary(params: {
  readonly source?: XmlElementNode
  readonly actual?: LocalXmlShape
  readonly proof: LocalXmlProof
  readonly annotations: XmlAnomalyAnnotationTable
  readonly binding: { readonly parent: object; readonly key: string | number; readonly hasSemanticValue: boolean }
}): LocalXmlChild | undefined {
  const { source, actual } = params
  // Контейнеры принадлежат вложенному frame: их нельзя поглотить поправкой
  // скалярного свойства даже при полном отсутствии обычного XML-выхода.
  if (source?.content.some((node) => node.type !== "text") || actual?.content?.some((node) => node.type !== "text")) {
    throw new Error("XML-граница не является скалярной")
  }
  const annotate = (xml: XmlRawValue): void => annotateXmlRawValue({
    ...params.binding, annotations: params.annotations, xml,
  })
  if (source === undefined) {
    if (actual !== undefined) annotate(null)
    return undefined
  }
  if (actual === undefined) {
    return params.proof.checkAbsent(source, () => annotate(encodeXmlRawElement(source)))
  }
  return params.proof.check(source, actual, (differences) => {
    annotate(createLocalXmlScalarPatch(source, differences))
  })
}
