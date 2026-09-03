import { isXmlElementNode, type XmlElementNode } from "../../../xml/import/document"
import type { CompiledXMLProofConsumer } from "./compiledRuleExecution"
import type { XMLItemOutputPreparation } from "./fromYAMLToXMLTypes"
import type { LocalXmlChild, LocalXmlProof } from "../xmlAnomaly/localProof"
import { completeLocalXmlFragment } from "../xmlAnomaly/localFragment"
import { applyXMLItemOwnOutput } from "../metadataItem/ownOutput"

/** Потребитель тела одного выхода; внешняя XMLRoot-оболочка принадлежит владельцу. */
export function createLocalXmlBodyConsumer(params: {
  readonly key: string
  readonly source: XmlElementNode
  readonly proof: LocalXmlProof
  readonly childReceipt: (value: unknown) => LocalXmlChild | undefined
  readonly scalarReceipt: (value: unknown) => import("../xmlAnomaly/localProof").LocalXmlScalar | undefined
  readonly itemPreparation?: XMLItemOutputPreparation
  readonly annotate?: Parameters<typeof completeLocalXmlFragment>[0]["annotate"]
}): CompiledXMLProofConsumer {
  const bindings = new Map<string, Parameters<NonNullable<CompiledXMLProofConsumer["bind"]>>[0]>()
  const complete = (source: XmlElementNode, name: string, value: unknown) => completeLocalXmlFragment({
    source, name, value, proof: params.proof, childReceipt: params.childReceipt,
    scalarReceipt: params.scalarReceipt, annotate: params.annotate,
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
      if (!binding.presentInXML) return
      if (!isXmlElementNode(binding.node)) {
        if (binding.node === undefined || !("value" in binding.node)) {
          throw new Error(`Не передан скалярный XML-узел свойства ${property.propertyKey}`)
        }
        return params.proof.checkValue(binding.node, String(value))
      }
      const receipt = params.childReceipt(value)
      if (receipt === undefined) return complete(binding.node, name, value)
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
