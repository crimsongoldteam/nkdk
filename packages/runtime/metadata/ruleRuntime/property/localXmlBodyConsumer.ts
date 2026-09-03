import { isXmlElementNode, type XmlAddressedNode, type XmlElementNode } from "../../../xml/import/document"
import type { XmlStructureDifference } from "../../../xml/structure/compare"
import { SUPPRESSED_LOCAL_XML_OUTPUT, type CompiledXMLProofConsumer } from "./compiledRuleExecution"
import type { XMLItemOutputPreparation } from "./fromYAMLToXMLTypes"
import type { LocalXmlChild, LocalXmlProof } from "../xmlAnomaly/localProof"
import { completeLocalXmlFragment } from "../xmlAnomaly/localFragment"
import { applyXMLItemOwnOutput } from "../metadataItem/ownOutput"

type LocalBodyProperty = Parameters<CompiledXMLProofConsumer["write"]>[0]["property"]

/** Потребитель тела одного выхода; внешняя XMLRoot-оболочка принадлежит владельцу. */
export function createLocalXmlBodyConsumer(params: {
  readonly key: string
  readonly source: XmlElementNode
  readonly proof: LocalXmlProof
  readonly childReceipt: (value: unknown) => LocalXmlChild | undefined
  readonly scalarReceipt: (value: unknown) => import("../xmlAnomaly/localProof").LocalXmlScalar | undefined
  readonly itemPreparation?: XMLItemOutputPreparation
  readonly annotate?: (boundary: Parameters<NonNullable<Parameters<typeof completeLocalXmlFragment>[0]["annotate"]>>[0] & {
    readonly property?: LocalBodyProperty
  }) => void
  readonly annotateScalar?: (boundary: {
    readonly source: XmlAddressedNode & { readonly value: string }
    readonly owner?: XmlElementNode
    readonly difference: XmlStructureDifference
    readonly property: LocalBodyProperty
  }) => void
  readonly annotateAbsent?: (boundary: {
    readonly name: string
    readonly path: readonly string[]
    readonly value: unknown
    readonly property: LocalBodyProperty
  }) => void
}): CompiledXMLProofConsumer {
  const bindings = new Map<string, Parameters<NonNullable<CompiledXMLProofConsumer["bind"]>>[0]>()
  const complete = (source: XmlElementNode, name: string, value: unknown, property?: LocalBodyProperty) => completeLocalXmlFragment({
    source, name, value, proof: params.proof, childReceipt: params.childReceipt,
    scalarReceipt: params.scalarReceipt,
    annotate: params.annotate === undefined ? undefined : boundary => params.annotate!({ ...boundary, property }),
  })
  return {
    bind(input) {
      if (input.presentInXML || !bindings.get(input.propertyKey)?.presentInXML) bindings.set(input.propertyKey, input)
    },
    write({ outputKey, property, path, value }) {
      if (outputKey !== params.key) throw new Error(`XML-выход ${outputKey} не принадлежит текущему телу ${params.key}`)
      const name = path.at(-1)
      if (name === undefined) {
        throw new Error(`Не подготовлена скалярная XML-граница: ${path.join("/")}`)
      }
      const binding = bindings.get(property.propertyKey)
      if (binding === undefined) throw new Error(`Не передана исходная XML-граница свойства ${property.propertyKey}`)
      if (!binding.presentInXML) {
        if (params.annotateAbsent === undefined) return
        params.annotateAbsent({ name, path, value, property })
        return SUPPRESSED_LOCAL_XML_OUTPUT
      }
      if (!isXmlElementNode(binding.node)) {
        if (binding.node === undefined || !("value" in binding.node)) {
          throw new Error(`Не передан скалярный XML-узел свойства ${property.propertyKey}`)
        }
        const scalarSource = binding.node
        return params.proof.checkValue(scalarSource, String(value), params.annotateScalar === undefined
          ? undefined : difference => params.annotateScalar!({
            source: scalarSource, owner: binding.owner, difference, property,
          }))
      }
      const receipt = params.childReceipt(value)
      if (receipt === undefined) return complete(binding.node, name, value, property)
      if (receipt.name !== name) throw new Error(`Изменена оболочка закрытого XML-ребёнка: ${receipt.name} → ${name}`)
      return receipt
    },
    complete(property) { bindings.delete(property.propertyKey) },
    finish(output) {
      const body = output.outputs.get(params.key)
      if (body === undefined) throw new Error(`Не подготовлено тело XML-выхода ${params.key}`)
      const receipt = complete(params.source, params.source.name, applyXMLItemOwnOutput(body, params.itemPreparation))
      bindings.clear()
      return new Map([[params.key, receipt]])
    },
  }
}
