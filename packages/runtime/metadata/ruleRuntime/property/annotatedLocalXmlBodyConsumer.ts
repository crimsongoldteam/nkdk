import type { XmlAnomalyAnnotationTable } from "../../../yaml/xmlAnomalyAnnotations"
import type { XmlElementNode } from "../../../xml/import/document"
import type { XmlStructureDifference } from "../../../xml/structure/compare"
import {
  createLocalXmlRawAppender,
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
  readonly rawYaml?: Record<string, unknown>
  readonly annotations: XmlAnomalyAnnotationTable
  readonly rawPathPrefix?: readonly string[]
}) {
  const rawYaml = params.rawYaml ?? params.yaml
  const appendRaw = createLocalXmlRawAppender({ yaml: rawYaml, annotations: params.annotations })
  return createLocalXmlBodyConsumer({
    ...params,
    annotate({ source, differences, property, propertySource }) {
      if (source === params.envelopeSource) {
        const own = differences.filter(difference => difference.ownerPath === source.path
          && /^\/@xmlns(?::[^/]+)?\[\d+\]$/u.test(difference.path.slice(source.path.length)))
        const order = differences.filter(difference => difference.path === `${source.path}/#attributes/#order`)
        const selector = params.rawPathPrefix?.[0]
        const projection = { yaml: rawYaml, annotations: params.annotations, root: source,
          path: [selector?.startsWith("@") === true ? selector : "@"] }
        projectLocalXmlOwnValues({ ...projection, differences: [...own, ...order] })
        const projected = new Set([...own, ...order])
        differences = differences.filter(difference => !projected.has(difference))
        if (differences.length === 0) return
        if (source !== params.source) {
          throw new Error(`Не согласована XML-аномалия оболочки: ${differences[0]!.path}`)
        }
      }
      if (property !== undefined) {
        if (propertySource !== undefined && source !== propertySource) {
          const relative = relativeElementPath(propertySource.path, source.path, true)
          if (relative === undefined) throw new Error(`XML-граница ${source.path} не принадлежит свойству ${propertySource.path}`)
          projectUnownedDifferences({
            yaml: rawYaml, annotations: params.annotations, source, differences, appendRaw,
            pathPrefix: [...(params.rawPathPrefix ?? []), ...property.xmlPath, ...relative],
          })
          return
        }
        const key = property.yamlKey
        const expectedName = property.xmlPath.at(-1)
        if (key === undefined || expectedName === undefined) {
          projectPathOnlyPropertyDifferences({
            yaml: rawYaml, annotations: params.annotations, source,
            differences,
            path: [...(params.rawPathPrefix ?? []), ...property.xmlPath],
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
      projectUnownedDifferences({
        yaml: rawYaml,
        annotations: params.annotations,
        source,
        differences,
        appendRaw,
        pathPrefix: source === params.source
          ? params.rawPathPrefix === undefined
            || params.rawPathPrefix.length === 0
            || source.name === "Form"
            || params.rawPathPrefix.at(-1) === source.name
            ? params.rawPathPrefix ?? []
            : [...params.rawPathPrefix, source.name]
          : [
              ...(params.rawPathPrefix ?? []),
              ...(relativeElementPath(params.source.path, source.path) ?? []),
            ],
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
    annotateAbsent({ property, semanticOmitted }) {
      const key = property.yamlKey
      if (
        key === undefined
        || property.propertyRule.toYAML === false
        || (
          semanticOmitted
          && Object.prototype.hasOwnProperty.call(property.propertyRule, "defaultValueXMLEmpty")
        )
      ) {
        const label = property.propertyRule.yaml ?? property.xmlPath.at(-1)
        if (label !== undefined) appendRaw([...(params.rawPathPrefix ?? ["@Form"]), label].join("\\"), null)
        return
      }
      annotateXmlRawValue({
        parent: params.yaml, key, annotations: params.annotations, xml: null,
        hasSemanticValue: Object.prototype.hasOwnProperty.call(params.yaml, key),
      })
    },
  })
}

function projectUnownedDifferences(params: {
  readonly yaml: Record<string, unknown>
  readonly annotations: XmlAnomalyAnnotationTable
  readonly source: XmlElementNode
  readonly differences: readonly XmlStructureDifference[]
  readonly appendRaw: ReturnType<typeof createLocalXmlRawAppender>
  readonly pathPrefix: readonly string[]
}): void {
  const elements = new Map<string, { node: XmlElementNode; path: string[] }>()
  const instructions = new Map<string, { node: Extract<XmlElementNode["content"][number], { type: "processingInstruction" }>; path: string[] }>()
  const visit = (node: XmlElementNode, path: string[]): void => {
    elements.set(node.path, { node, path })
    for (const child of node.content) {
      if (child.type === "element") visit(child, [...path, child.name])
      if (child.type === "processingInstruction") {
        instructions.set(child.path, { node: child, path: [...path, `?${child.target}`] })
      }
    }
  }
  visit(params.source, [])

  const handled = new Set<XmlStructureDifference>()
  for (const difference of params.differences) {
    if (difference.kind !== "presence") continue
    const element = elements.get(difference.path)
    if (element !== undefined) {
      if (element.path.length === 0) {
        throw new Error(`Нельзя локализовать наличие корня ${difference.path} как дочерний raw`)
      }
      params.appendRaw([...params.pathPrefix, ...element.path].join("\\"), encodeXmlRawElement(element.node))
      handled.add(difference)
      continue
    }
    const instruction = instructions.get(difference.path)
    if (instruction !== undefined) {
      params.appendRaw([...params.pathPrefix, ...instruction.path].join("\\"), encodeXmlRawProcessingInstruction(instruction.node))
      handled.add(difference)
      continue
    }
    const generatedPath = relativeElementPath(params.source.path, difference.path)
    if (generatedPath !== undefined) {
      params.appendRaw([...params.pathPrefix, ...generatedPath].join("\\"), null)
      handled.add(difference)
    }
  }

  const scalarByOwner = new Map<string, XmlStructureDifference[]>()
  for (const difference of params.differences) {
    if (handled.has(difference)) continue
    const owner = elements.get(difference.ownerPath)
    if (owner === undefined) throw new Error(`Неизвестная XML-граница ${difference.path}`)
    const relative = difference.path.slice(difference.ownerPath.length + 1)
    if (difference.kind !== "order" && !relative.startsWith("@") && !relative.startsWith("#text[")) {
      throw new Error(`Неизвестное XML-расхождение ${difference.path}`)
    }
    const own = scalarByOwner.get(difference.ownerPath) ?? []
    own.push(difference)
    scalarByOwner.set(difference.ownerPath, own)
  }
  for (const [ownerPath, differences] of scalarByOwner) {
    const owner = elements.get(ownerPath)!
    projectLocalXmlOwnValues({
      yaml: params.yaml,
      annotations: params.annotations,
      root: owner.node,
      differences,
      path: [...params.pathPrefix, ...owner.path],
    })
  }

}

function relativeElementPath(rootPath: string, path: string, retainOccurrence = false): string[] | undefined {
  if (!path.startsWith(`${rootPath}/`)) return undefined
  const result: string[] = []
  for (const segment of path.slice(rootPath.length + 1).split("/")) {
    const element = /^([^/@#?]+)\[\d+\]$/u.exec(segment)
    if (element === null) return undefined
    result.push(retainOccurrence ? segment : element[1]!)
  }
  return result.length === 0 ? undefined : result
}

function projectPathOnlyPropertyDifferences(params: {
  readonly yaml: Record<string, unknown>
  readonly annotations: XmlAnomalyAnnotationTable
  readonly source: BodyConsumerParams["source"]
  readonly differences: readonly XmlStructureDifference[]
  readonly path: readonly string[]
}): void {
  const own = params.differences.filter((difference) =>
    difference.kind !== "order" && difference.ownerPath === params.source.path && (
      difference.path.startsWith(`${params.source.path}/@`)
      || difference.path.startsWith(`${params.source.path}/#text[`)
    ),
  )
  const ownSet = new Set(own)
  projectLocalXmlOwnValues({ ...params, root: params.source, differences: [
    ...own, ...params.differences.filter(difference => difference.kind === "order" && difference.ownerPath === params.source.path),
  ] })

  const appendRaw = createLocalXmlRawAppender(params)
  const children = params.source.content.filter(
    (node): node is XmlElementNode => node.type === "element",
  )
  const childrenByPath = new Map(children.map((child) => [child.path, child] as const))
  const projected = new Set<string>()
  for (const difference of params.differences) {
    if (difference.kind === "order" || ownSet.has(difference)) continue
    const relative = difference.path.startsWith(`${params.source.path}/`)
      ? difference.path.slice(params.source.path.length + 1)
      : ""
    const firstSegment = /^([^/#?]+\[\d+\])(?:\/|$)/u.exec(relative)?.[1]
    const child = firstSegment === undefined
      ? undefined
      : childrenByPath.get(`${params.source.path}/${firstSegment}`)
    const generatedName = firstSegment === undefined
      ? undefined
      : /^([^/#?]+)\[\d+\]$/u.exec(firstSegment)?.[1]
    const identity = child?.path ?? generatedName
    if (identity === undefined || projected.has(identity)) {
      if (identity === undefined) throw new Error(`Неизвестная XML-граница ${difference.path}`)
      continue
    }
    projected.add(identity)
    const name = child?.name ?? generatedName!
    appendRaw([...params.path, name].join("\\"), child === undefined ? null : encodeXmlRawElement(child))
  }
}

/** Один локальный proof для всех XML-выходов item без сборки общего документа. */
export function createAnnotatedLocalXmlBodyConsumers(params: {
  readonly sources: readonly {
    readonly key: string
    readonly source: BodyConsumerParams["source"]
    readonly envelopeSource?: BodyConsumerParams["envelopeSource"]
    readonly proof: BodyConsumerParams["proof"]
    readonly itemPreparation?: BodyConsumerParams["itemPreparation"]
    readonly xmlEnvelope?: BodyConsumerParams["xmlEnvelope"]
    readonly rawPathPrefix?: readonly string[]
  }[]
  readonly yaml: Record<string, unknown>
  readonly rawYaml?: Record<string, unknown>
  readonly annotations: XmlAnomalyAnnotationTable
  readonly childReceipt: BodyConsumerParams["childReceipt"]
  readonly scalarReceipt: BodyConsumerParams["scalarReceipt"]
}): CompiledXMLProofConsumer {
  const consumers = new Map(params.sources.map((source) => [source.key, createAnnotatedLocalXmlBodyConsumer({
    ...source,
    yaml: params.yaml,
    ...(params.rawYaml === undefined ? {} : { rawYaml: params.rawYaml }),
    annotations: params.annotations,
    childReceipt: params.childReceipt,
    scalarReceipt: params.scalarReceipt,
  })] as const))
  return {
    bind(binding) {
      const matching = binding.node === undefined
        ? []
        : params.sources.filter(({ source }) =>
            binding.node === source || binding.node!.path.startsWith(`${source.path}/`))
      const deepest = matching.reduce(
        (length, { source }) => Math.max(length, source.path.length),
        -1,
      )
      const targets = matching.length === 0
        ? params.sources
        : matching.filter(({ source }) => source.path.length === deepest)
      for (const { key } of targets) consumers.get(key)?.bind?.(binding)
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
      for (const consumer of [...consumers.values()].reverse()) {
        for (const [key, receipt] of consumer.finish(output)) roots.set(key, receipt)
      }
      return roots
    },
  }
}
