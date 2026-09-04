import type { XmlAnomalyAnnotationTable } from "../../../yaml/xmlAnomalyAnnotations"
import type { XmlElementNode } from "../../../xml/import/document"
import type { XmlStructureDifference } from "../../../xml/structure/compare"
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
  readonly rawPathPrefix?: readonly string[]
}) {
  const appendRaw = createLocalXmlRawAppender({ yaml: params.yaml, annotations: params.annotations })
  return createLocalXmlBodyConsumer({
    ...params,
    annotate({ source, differences, property }) {
      if (property !== undefined) {
        const key = property.yamlKey
        const expectedName = property.xmlPath.at(-1)
        if (key === undefined || expectedName === undefined) {
          projectPathOnlyPropertyDifferences({
            yaml: params.yaml, annotations: params.annotations, source,
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
      projectUnownedDifferences({
        yaml: params.yaml,
        annotations: params.annotations,
        source,
        differences,
        appendRaw,
        pathPrefix: source === params.source
          ? params.rawPathPrefix ?? []
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
        || semanticOmitted
      ) {
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
    if (handled.has(difference) || difference.kind === "order") continue
    const owner = elements.get(difference.ownerPath)
    if (owner === undefined) throw new Error(`Неизвестная XML-граница ${difference.path}`)
    const relative = difference.path.slice(difference.ownerPath.length + 1)
    if (!relative.startsWith("@") && !relative.startsWith("#text[")) {
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

  const orderOwners = new Set(params.differences
    .filter(({ kind }) => kind === "order")
    .map(({ ownerPath }) => ownerPath))
  for (const ownerPath of orderOwners) {
    const owner = elements.get(ownerPath)
    if (owner === undefined) throw new Error(`Неизвестная XML-граница порядка ${ownerPath}`)
    projectLocalXmlOrder({
      yaml: params.yaml,
      annotations: params.annotations,
      root: owner.node,
      differences: params.differences,
      path: [...params.pathPrefix, ...owner.path],
    })
  }
}

function relativeElementPath(rootPath: string, path: string): string[] | undefined {
  if (!path.startsWith(`${rootPath}/`)) return undefined
  const result: string[] = []
  for (const segment of path.slice(rootPath.length + 1).split("/")) {
    const element = /^([^/#?]+)\[\d+\]$/u.exec(segment)
    if (element === null) return undefined
    result.push(element[1]!)
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
  projectLocalXmlOwnValues({ ...params, root: params.source, differences: own })
  projectLocalXmlOrder({ ...params, root: params.source })

  const appendRaw = createLocalXmlRawAppender(params)
  const children = params.source.content.filter(
    (node): node is XmlElementNode => node.type === "element",
  )
  const projected = new Set<string>()
  for (const difference of params.differences) {
    if (difference.kind === "order" || own.includes(difference)) continue
    const child = children.find(({ path }) => difference.path === path || difference.path.startsWith(`${path}/`))
    const relative = difference.path.startsWith(`${params.source.path}/`)
      ? difference.path.slice(params.source.path.length + 1)
      : ""
    const generatedName = /^([^/#?]+)\[\d+\](?:\/|$)/u.exec(relative)?.[1]
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
    readonly proof: BodyConsumerParams["proof"]
    readonly itemPreparation?: BodyConsumerParams["itemPreparation"]
    readonly xmlEnvelope?: BodyConsumerParams["xmlEnvelope"]
    readonly rawPathPrefix?: readonly string[]
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
      for (const consumer of consumers.values()) {
        for (const [key, receipt] of consumer.finish(output)) roots.set(key, receipt)
      }
      return roots
    },
  }
}
