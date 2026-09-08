import { createLocalXmlProof, isXmlElementNode, type ConfigurationContextWithExportToXML, type XmlAnomalyAnnotationTable, type XmlElementNode } from "@nkdk/runtime"
import {
  createAnnotatedLocalXmlBodyConsumers,
  createCompiledRuleExecution,
  createXmlImportUndoLog,
  attachXmlImportAttemptParticipants,
  type CompiledPropertyRuleExecution,
  type DirectImportRoundTripExecution,
  type XMLItemOutputPreparation,
} from "@nkdk/runtime/rule-kit"
import type { ImportedIssueDecision } from "./classifyImportedIssues"
import { applyImportedIssueDecisions } from "./applyImportedIssueDecisions"
import type { ValidationProfiler } from "../validation/profile"
import { addressableMetadataItemSegment } from "../validation/addressableMetadataTargets"

interface SourceBoundary {
  readonly key: string
  readonly source: XmlElementNode
  readonly envelopeSource?: XmlElementNode
  readonly proof: ReturnType<typeof createLocalXmlProof>
  readonly rawPathPrefix?: readonly string[]
}

/** Рабочий локальный round-trip второго прохода без полного контрольного XML. */
export function createImportLocalRoundTrip(params: {
  readonly execution: CompiledPropertyRuleExecution
  readonly context: ConfigurationContextWithExportToXML
  readonly annotations: XmlAnomalyAnnotationTable
  readonly decisions: readonly ImportedIssueDecision[]
  readonly profiler?: ValidationProfiler
  readonly attemptParticipant?: object
  readonly placeCollectionItem?: (
    parent: Record<string, unknown>, key: string, yamlPath: readonly (string | number)[],
    annotations: XmlAnomalyAnnotationTable,
    sourceYamlPath?: readonly (string | number)[],
  ) => void
  readonly isDocumentRoot?: (rule: import("@nkdk/runtime/rule-kit").MetadataItemRule) => boolean
  readonly selectDecisions?: (
    yaml: Record<string, unknown>,
    rule: import("@nkdk/runtime/rule-kit").MetadataItemRule,
    yamlPath: readonly (string | number)[],
    root: boolean,
    annotations: XmlAnomalyAnnotationTable,
    itemName?: string,
    context?: import("@nkdk/runtime").ConfigurationContext,
    namedYamlPath?: () => readonly (string | number)[],
    logicalAddressSegment?: string,
    namedCollectionItem?: boolean,
  ) => readonly ImportedIssueDecision[]
  readonly finalizeRootYaml?: (
    yaml: Record<string, unknown>,
    rule: import("@nkdk/runtime/rule-kit").MetadataItemRule,
  ) => void
  readonly prepareYamlForProof?: (
    yaml: Record<string, unknown>,
    rule: import("@nkdk/runtime/rule-kit").MetadataItemRule,
    yamlPath: readonly (string | number)[],
  ) => void
  readonly prepareRootOutput?: (params: {
    readonly key: string
    readonly source: XmlElementNode
    readonly proof: ReturnType<typeof createLocalXmlProof>
  }) => XMLItemOutputPreparation | undefined
  readonly prepareRootContext?: (params: {
    readonly key: string
    readonly source: XmlElementNode
  }) => ConfigurationContextWithExportToXML | undefined
  readonly prepareRootProof?: (params: {
    readonly key: string
    readonly source: XmlElementNode
  }) => ReturnType<typeof createLocalXmlProof> | undefined
  readonly prepareRootRawPathPrefix?: (params: {
    readonly key: string
    readonly source: XmlElementNode
    readonly tags?: readonly string[]
  }) => readonly string[] | undefined
  readonly accumulateRawAtDocumentRoot?: boolean
}): DirectImportRoundTripExecution & {
  takeResult(yaml: object): import("@nkdk/runtime/rule-kit").CompiledXMLProofResult
  retainReceipt(receipt: import("@nkdk/runtime/rule-kit").LocalXmlChild): object
  release(yaml: object): void
} {
  const active: SourceBoundary[][] = []
  const activeYaml: Record<string, unknown>[] = []
  const activeItemContexts: import("@nkdk/runtime").ContextElementToXML[] = []
  const activeItemAddresses: { readonly yamlPath: readonly (string | number)[]; readonly itemName?: string; readonly rule: import("@nkdk/runtime/rule-kit").MetadataItemRule }[] = []
  const undo = createXmlImportUndoLog()
  const collectionSegments = new WeakMap<import("@nkdk/runtime/rule-kit").MetadataItemRule, ReadonlyMap<string, string>>()
  const collectionSegment = (rule: import("@nkdk/runtime/rule-kit").MetadataItemRule, key: string) => {
    let segments = collectionSegments.get(rule)
    if (segments === undefined) {
      segments = new Map(rule.childCollections?.flatMap(child => child.configurationIndexUidSegment === undefined
        ? [] : [[child.propertyKey, child.configurationIndexUidSegment] as const]))
      collectionSegments.set(rule, segments)
    }
    return segments.get(key)
  }
  const preparedByYaml = new WeakMap<object, {
    readonly sources: SourceBoundary[]
    readonly contextItem: import("@nkdk/runtime").ContextElementToXML
  }>()
  const opened = new WeakMap<XmlElementNode, string>()
  const execution = createCompiledRuleExecution({
    execution: params.execution,
    prepare(item) {
      const sources = item.sources.map(({ xml, envelopeSource }, index): SourceBoundary => {
        if (!isXmlElementNode(xml)) throw new Error(`Локальный proof требует адресный XML-источник ${item.rule.itemType}`)
        const address = `${item.rule.itemType}:${item.yamlPath.join("/")}`
        const previous = opened.get(xml)
        if (previous !== undefined) throw new Error(`XML-граница ${xml.path} открыта повторно: ${previous} → ${address}`)
        opened.set(xml, address)
        // Вложенный item открывается поверх непосредственного родителя. Его proof
        // передаётся по стеку frame, без поиска и сортировки всех предков.
        const inherited = active.at(-1)?.find(({ source }) => isInside(source, xml))
        const key = `source-${index}`
        const rootRawPathPrefix = params.prepareRootRawPathPrefix?.({
          key,
          source: xml,
          tags: item.sources[index]?.tags,
        })
        const rawPathPrefix = rootRawPathPrefix ?? (
          inherited?.rawPathPrefix === undefined
            ? undefined
            : params.accumulateRawAtDocumentRoot === true
              ? [...inherited.rawPathPrefix, ...relativeXmlElementNames(inherited.source, xml)]
              : inherited.rawPathPrefix
        )
        return {
          key,
          source: xml,
          ...(envelopeSource === undefined && active.length !== 0 ? {} : { envelopeSource: envelopeSource ?? xml }),
          proof: inherited?.proof ?? params.prepareRootProof?.({ key: `source-${index}`, source: xml }) ?? createLocalXmlProof(),
          ...(rawPathPrefix === undefined ? {} : { rawPathPrefix }),
        }
      })
      const depths = [active.length, activeYaml.length, activeItemContexts.length, activeItemAddresses.length]
      undo.remember(() => {
        active.length = depths[0]!
        activeYaml.length = depths[1]!
        activeItemContexts.length = depths[2]!
        activeItemAddresses.length = depths[3]!
        preparedByYaml.delete(item.yaml)
      })
      const contextItem = itemContext(item)
      activeItemContexts.push(contextItem)
      preparedByYaml.set(item.yaml, { sources, contextItem })
      return {
        context: {
          ...item.context,
          importFromYAML: {
            ...item.context.importFromYAML,
            metadataTargetOwners: item.context.exportToYAML?.metadataTargetOwners
              ?? item.context.importFromYAML?.metadataTargetOwners,
          },
          exportToXML: {
            ...params.context.exportToXML,
            itemsTree: activeItemContexts,
          },
        },
        annotations: params.annotations,
        name: item.itemName,
        sourceItemName: item.itemName,
        outputs: sources.map(({ key, source, proof, envelopeSource }, index) => ({
          key,
          tags: item.sources[index]?.tags,
          ...(params.prepareRootContext === undefined
            ? {}
            : { context: params.prepareRootContext({ key, source }) }),
          itemPreparation: withSourceTransportAttributes(
            params.prepareRootOutput === undefined
              ? undefined
              : params.prepareRootOutput({ key, source, proof }),
            source,
            envelopeSource !== undefined,
          ),
        })),
      }
    },
    beforeFinish({ yaml, rule, yamlPath, root, itemName, context, rulePath }) {
      params.prepareYamlForProof?.(yaml, rule, yamlPath)
      const documentRoot = root && (
        params.isDocumentRoot?.(rule) ?? yamlPath.length === 0
      )
      if (documentRoot) {
        params.finalizeRootYaml?.(yaml, rule)
      }
      const parentRule = activeItemAddresses.at(-2)?.rule
      const propertyKey = rulePath.at(-1)?.propertyKey
      const propertyRule = propertyKey === undefined ? undefined : parentRule?.properties[propertyKey]
      const nested = propertyRule === undefined ? undefined : params.execution.getTypeRule(propertyRule.type, "yamlToXMLNestedRule")
      const logicalAddressSegment = propertyRule === undefined ? undefined : addressableMetadataItemSegment({
        rule, propertyRule, itemName,
        collectionUidSegment: parentRule === undefined || propertyKey === undefined ? undefined : collectionSegment(parentRule, propertyKey)
          ?? (nested?.kind === "collection" ? nested.configurationIndexUidSegment : undefined),
      })
      const decisions = params.selectDecisions?.(yaml, rule, yamlPath, documentRoot, params.annotations, itemName, context, () => {
        const named = [...yamlPath]
        for (const address of activeItemAddresses) {
          const position = address.yamlPath.length - 1
          if (address.itemName !== undefined && typeof named[position] === "number") {
            named[position] = address.itemName
          }
        }
        return named
      }, logicalAddressSegment, nested?.kind === "collection" && nested.yamlShape === "record")
        ?? (documentRoot ? params.decisions : [])
      if (decisions.length !== 0) {
        applyImportedIssueDecisions({
          data: yaml,
          annotations: params.annotations,
          decisions,
        })
      }
      if (documentRoot) params.annotations.retainSubtree(yaml)
    },
    consumer(item, receipts, prepared) {
      const { yaml, rule } = item
      // Штатная подготовка экспорта уже отличает именованную коллекцию от
      // массива: у элемента массива prepared.name отсутствует.
      activeItemAddresses.push({ yamlPath: item.yamlPath, itemName: prepared.name, rule: item.rule })
      const preparedItem = preparedByYaml.get(yaml)
      if (preparedItem === undefined) throw new Error("Не подготовлены XML-границы локального proof")
      const { sources, contextItem } = preparedItem
      active.push(sources)
      const rawYaml = params.accumulateRawAtDocumentRoot === true
        ? activeYaml[0] ?? yaml
        : yaml
      activeYaml.push(yaml)
      const delegate = createAnnotatedLocalXmlBodyConsumers({
        sources: sources.map((source) => ({
          ...source,
          itemPreparation: prepared.outputs.find(({ key }) => key === source.key)?.itemPreparation,
          xmlEnvelope: prepared.outputs.find(({ key }) => key === source.key)?.xmlEnvelope,
          ...(source.rawPathPrefix === undefined ? {} : { rawPathPrefix: source.rawPathPrefix }),
        })),
        yaml,
        rawYaml,
        annotations: params.annotations,
        ...receipts,
      })
      return {
        bind: delegate.bind,
        write: delegate.write,
        complete: delegate.complete,
        finish(output) {
          const startedAt = performance.now()
          try {
            try {
              return delegate.finish(output)
            } catch (cause) {
              const message = cause instanceof Error ? cause.message : String(cause)
              throw new Error(`${rule.itemType} ${itemDescription(yaml, sources, opened)}: ${message}`, { cause })
            }
          } finally {
            params.profiler?.record("Подготовка импорта конфигурации", "Локальный XML proof", {
              items: sources.length,
              timeMs: performance.now() - startedAt,
            })
            if (active.at(-1) !== sources) throw new Error("XML-границы локального proof закрываются вне порядка")
            active.pop()
            if (activeYaml.at(-1) !== yaml) throw new Error("YAML-границы локального proof закрываются вне порядка")
            activeYaml.pop()
            if (activeItemContexts.at(-1) !== contextItem) throw new Error("Rules локального proof закрываются вне порядка")
            activeItemContexts.pop()
            activeItemAddresses.pop()
          }
        },
      }
    },
  })
  const attemptParticipant = {}
  attachXmlImportAttemptParticipants(attemptParticipant, [params.attemptParticipant, undo, execution.attemptParticipant])
  return {
    ...execution,
    finalizeCreatedItem({ yaml, rule, yamlPath, context }) {
      const decisions = params.selectDecisions?.(yaml, rule, yamlPath, false, params.annotations, undefined, context) ?? []
      if (decisions.some(decision => decision.target.path.length === 0)) {
        throw new Error("Аномалия всего созданного объекта требует адреса в родительской коллекции")
      }
      if (decisions.length !== 0) applyImportedIssueDecisions({ data: yaml, annotations: params.annotations, decisions })
    },
    attemptParticipant,
    ...(params.placeCollectionItem === undefined ? {} : {
      placeCollectionItem: (parent: Record<string, unknown>, key: string, path: readonly (string | number)[], sourceYamlPath?: readonly (string | number)[]) =>
        params.placeCollectionItem!(parent, key, path, params.annotations, sourceYamlPath),
    }),
    accepts(sources) { return sources.every(({ xml }) => isXmlElementNode(xml)) },
    takeResult(yaml) { return execution.takeResult(yaml) },
    retainReceipt(receipt) { return execution.retainReceipt(receipt) },
    release(yaml) { execution.takeResult(yaml) },
  }
}

function itemContext(item: {
  readonly rule: import("@nkdk/runtime/rule-kit").MetadataItemRule
  readonly itemName?: string
  readonly yamlPath: readonly (string | number)[]
}): import("@nkdk/runtime").ContextElementToXML {
  return {
    name: item.itemName ?? "",
    itemType: item.rule.itemType as import("@nkdk/runtime").ContextElementToXML["itemType"],
    path: item.yamlPath.join("/"),
    ...(item.rule.externalMetadata === undefined ? {} : { externalMetadata: item.rule.externalMetadata }),
  }
}

const TRANSPORT_ATTRIBUTE = /^(?:id|name|uuid|version|xmlns(?::.*)?)$/u

function withSourceTransportAttributes(
  preparation: XMLItemOutputPreparation | undefined,
  source: XmlElementNode,
  compareNamespaces = false,
): XMLItemOutputPreparation | undefined {
  const retained = Object.fromEntries(source.attributes
    .filter(({ name }) => TRANSPORT_ATTRIBUTE.test(name) && !(compareNamespaces && /^xmlns(?::|$)/u.test(name)))
    .map(({ name, value }) => [`_${name}`, value]))
  if (Object.keys(retained).length === 0) return preparation
  return {
    attributes: (own) => {
      const result = { ...(preparation?.attributes(own) ?? own) }
      for (const key of Object.keys(result)) {
        if (key.startsWith("_") && TRANSPORT_ATTRIBUTE.test(key.slice(1))
          && !(compareNamespaces && /^_xmlns(?::|$)/u.test(key))) delete result[key]
      }
      for (const [key, value] of Object.entries(retained)) {
        result[key] = value
      }
      const ordered: Record<string, unknown> = {}
      for (const { name } of source.attributes) {
        const key = `_${name}`
        if (Object.prototype.hasOwnProperty.call(result, key)) ordered[key] = result[key]
      }
      for (const [key, value] of Object.entries(result)) {
        if (!Object.prototype.hasOwnProperty.call(ordered, key)) ordered[key] = value
      }
      return ordered
    },
    ...(preparation?.routeProperty === undefined ? {} : { routeProperty: preparation.routeProperty }),
    ...(preparation?.initialize === undefined ? {} : { initialize: preparation.initialize }),
    ...(preparation?.wrap === undefined ? {} : { wrap: preparation.wrap }),
  }
}

function itemDescription(
  yaml: Record<string, unknown>,
  sources: readonly SourceBoundary[],
  opened: WeakMap<XmlElementNode, string>,
): string {
  return `${sources.map(({ source }) => `${source.path} @ ${opened.get(source) ?? "?"}`).join(", ")} (${Object.keys(yaml).join(", ")})`
}

function isInside(parent: XmlElementNode, child: XmlElementNode): boolean {
  return child === parent || child.path.startsWith(`${parent.path}/`)
}

function relativeXmlElementNames(parent: XmlElementNode, child: XmlElementNode): string[] {
  if (child === parent) return []
  if (!child.path.startsWith(`${parent.path}/`)) {
    throw new Error(`XML-граница ${child.path} не вложена в ${parent.path}`)
  }
  return child.path.slice(parent.path.length + 1).split("/").map((segment) => {
    const match = /^(.*)\[(\d+)\]$/u.exec(segment)
    if (match === null || match[2] === "1") return match?.[1] ?? segment
    return `${match[1]}[${match[2]}]`
  })
}
