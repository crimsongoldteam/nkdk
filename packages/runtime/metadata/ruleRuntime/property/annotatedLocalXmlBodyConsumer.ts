import type { XmlAnomalyAnnotationTable } from "../../../yaml/xmlAnomalyAnnotations"
import {
  createLocalXmlRawAppender,
  projectLocalXmlOrder,
  projectLocalXmlOwnValues,
} from "../xmlAnomaly/yamlProjection"
import { encodeXmlRawElement, encodeXmlRawProcessingInstruction } from "../../../xml/structure/rawCodec"
import { annotateXmlRawValue } from "../xmlAnomaly/yamlProjection"
import {
  projectLocalXmlPropertyDifferences,
  projectLocalXmlScalarDifference,
} from "../xmlAnomaly/localPropertyBoundary"
import { createLocalXmlBodyConsumer } from "./localXmlBodyConsumer"
import type { CompiledXMLProofConsumer } from "./compiledRuleExecution"
import type { LocalXmlChild } from "../xmlAnomaly/localProof"

type BodyConsumerParams = Parameters<typeof createLocalXmlBodyConsumer>[0]

/** Локальный proof с записью существующих raw-аннотаций прямо в итоговый YAML. */
export function createAnnotatedLocalXmlBodyConsumer(params: Omit<
  BodyConsumerParams,
  "annotate" | "annotateScalar"
> & {
  readonly yaml: Record<string, unknown>
  readonly annotations: XmlAnomalyAnnotationTable
}) {
  const appendRaw = createLocalXmlRawAppender({ yaml: params.yaml, annotations: params.annotations })
  return createLocalXmlBodyConsumer({
    ...params,
    annotate({ source, differences, property }) {
      if (property !== undefined) {
        const key = property.yamlKey
        const expectedName = property.xmlPath.at(-1)
        if (key === undefined || expectedName === undefined) {
          projectLocalXmlOwnValues({
            yaml: params.yaml, annotations: params.annotations, root: source,
            differences, path: property.xmlPath,
          })
          projectLocalXmlOrder({
            yaml: params.yaml, annotations: params.annotations, root: source,
            differences, path: property.xmlPath,
          })
          return
        }
        projectLocalXmlPropertyDifferences({
          parent: params.yaml, key, annotations: params.annotations,
          source, expectedName, differences,
          hasSemanticValue: Object.prototype.hasOwnProperty.call(params.yaml, key),
          orderPath: property.xmlPath,
        })
        return
      }
      const children = new Map(source.content.flatMap((node) =>
        node.type === "element" ? [[node.path, node] as const] : [],
      ))
      const instructions = new Map(source.content.flatMap((node) =>
        node.type === "processingInstruction" ? [[node.path, node] as const] : [],
      ))
      const own = differences.filter((difference) => {
        if (difference.kind === "order") return false
        if (difference.ownerPath !== source.path || !difference.path.startsWith(`${source.path}/`)) return true
        const relative = difference.path.slice(source.path.length + 1)
        if (relative.startsWith("@") || relative.startsWith("#text[")) return true
        const child = /^([^/#?]+)\[(\d+)\]$/u.exec(relative)
        if (difference.kind === "presence" && child !== null) {
          const sourceChild = children.get(difference.path)
          if (sourceChild === undefined) {
            throw new Error(`Не подготовлена YAML-граница лишнего XML-ребёнка ${difference.path}`)
          }
          appendRaw(child[1]!, encodeXmlRawElement(sourceChild))
          return false
        }
        const instruction = /^\?([^/]+)\[(\d+)\]$/u.exec(relative)
        if (difference.kind !== "presence" || instruction === null) return true
        const sourceInstruction = instructions.get(difference.path)
        if (sourceInstruction === undefined) {
          throw new Error(`Не подготовлена YAML-граница лишней XML-инструкции ${difference.path}`)
        }
        appendRaw(`?${instruction[1]!}`, encodeXmlRawProcessingInstruction(sourceInstruction))
        return false
      })
      projectLocalXmlOwnValues({
        yaml: params.yaml, annotations: params.annotations, root: source, differences: own,
      })
      projectLocalXmlOrder({
        yaml: params.yaml, annotations: params.annotations, root: source, differences,
      })
    },
    annotateScalar({ source, owner, difference, property }) {
      if (owner === undefined) {
        throw new Error(`Для XML-скаляра ${source.path} не передан непосредственный владелец`)
      }
      projectLocalXmlScalarDifference({
        yaml: params.yaml, annotations: params.annotations, owner, source, difference,
        path: property.xmlPath.slice(0, -1),
      })
    },
    annotateAbsent({ property }) {
      const key = property.yamlKey
      if (key === undefined || property.propertyRule.toYAML === false) {
        const label = property.propertyRule.yaml ?? property.xmlPath.at(-1)
        if (label !== undefined) appendRaw(`@Form\\${label}`, null)
        return
      }
      annotateXmlRawValue({
        parent: params.yaml, key, annotations: params.annotations, xml: null,
        hasSemanticValue: Object.prototype.hasOwnProperty.call(params.yaml, key),
      })
    },
  })
}

/** Один локальный proof для всех XML-выходов item без сборки общего документа. */
export function createAnnotatedLocalXmlBodyConsumers(params: {
  readonly sources: readonly {
    readonly key: string
    readonly source: BodyConsumerParams["source"]
    readonly proof: BodyConsumerParams["proof"]
    readonly itemPreparation?: BodyConsumerParams["itemPreparation"]
    readonly xmlEnvelope?: BodyConsumerParams["xmlEnvelope"]
  }[]
  readonly yaml: Record<string, unknown>
  readonly annotations: XmlAnomalyAnnotationTable
  readonly childReceipt: BodyConsumerParams["childReceipt"]
  readonly scalarReceipt: BodyConsumerParams["scalarReceipt"]
}): CompiledXMLProofConsumer {
  const consumers = new Map(params.sources.map((source) => [source.key, createAnnotatedLocalXmlBodyConsumer({
    ...source,
    yaml: params.yaml,
    annotations: params.annotations,
    childReceipt: params.childReceipt,
    scalarReceipt: params.scalarReceipt,
  })] as const))
  return {
    bind(binding) {
      for (const consumer of consumers.values()) consumer.bind?.(binding)
    },
    write(event) {
      const consumer = consumers.get(event.outputKey)
      if (consumer === undefined) throw new Error(`Не подготовлен локальный XML-выход ${event.outputKey}`)
      return consumer.write(event)
    },
    complete(property) {
      for (const consumer of consumers.values()) consumer.complete?.(property)
    },
    finish(output) {
      const roots = new Map<string, LocalXmlChild>()
      for (const consumer of consumers.values()) {
        for (const [key, receipt] of consumer.finish(output)) roots.set(key, receipt)
      }
      return roots
    },
  }
}
