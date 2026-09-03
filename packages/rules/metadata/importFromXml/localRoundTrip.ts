import { createLocalXmlProof, isXmlElementNode, type ConfigurationContextWithExportToXML, type XmlAnomalyAnnotationTable, type XmlElementNode } from "@nkdk/runtime"
import {
  createAnnotatedLocalXmlBodyConsumers,
  createCompiledRuleExecution,
  type CompiledPropertyRuleExecution,
  type DirectImportRoundTripExecution,
  type XMLItemOutputPreparation,
} from "@nkdk/runtime/rule-kit"
import type { ImportedIssueDecision } from "./classifyImportedIssues"
import { applyImportedIssueDecisions } from "./applyImportedIssueDecisions"
import type { ValidationProfiler } from "../validation/profile"

interface SourceBoundary {
  readonly key: string
  readonly source: XmlElementNode
  readonly proof: ReturnType<typeof createLocalXmlProof>
}

/** Рабочий локальный round-trip второго прохода без полного контрольного XML. */
export function createImportLocalRoundTrip(params: {
  readonly execution: CompiledPropertyRuleExecution
  readonly context: ConfigurationContextWithExportToXML
  readonly annotations: XmlAnomalyAnnotationTable
  readonly decisions: readonly ImportedIssueDecision[]
  readonly profiler?: ValidationProfiler
  readonly selectDecisions?: (
    yaml: Record<string, unknown>,
    rule: import("@nkdk/runtime/rule-kit").MetadataItemRule,
  ) => readonly ImportedIssueDecision[]
  readonly finalizeRootYaml?: (
    yaml: Record<string, unknown>,
    rule: import("@nkdk/runtime/rule-kit").MetadataItemRule,
  ) => void
  readonly prepareRootOutput?: (params: {
    readonly key: string
    readonly source: XmlElementNode
  }) => XMLItemOutputPreparation | undefined
  readonly prepareRootContext?: (params: {
    readonly key: string
    readonly source: XmlElementNode
  }) => ConfigurationContextWithExportToXML | undefined
  readonly prepareRootProof?: (params: {
    readonly key: string
    readonly source: XmlElementNode
  }) => ReturnType<typeof createLocalXmlProof> | undefined
}): DirectImportRoundTripExecution & {
  takeResult(yaml: object): import("@nkdk/runtime/rule-kit").CompiledXMLProofResult
  retainReceipt(receipt: import("@nkdk/runtime/rule-kit").LocalXmlChild): object
  release(yaml: object): void
} {
  const active: SourceBoundary[][] = []
  const preparedByYaml = new WeakMap<object, SourceBoundary[]>()
  const opened = new WeakMap<XmlElementNode, string>()
  const execution = createCompiledRuleExecution({
    execution: params.execution,
    prepare(item) {
      const parent = active.at(-1) ?? []
      const sources = item.sources.map(({ xml }, index): SourceBoundary => {
        if (!isXmlElementNode(xml)) throw new Error(`Локальный proof требует адресный XML-источник ${item.rule.itemType}`)
        const address = `${item.rule.itemType}:${item.yamlPath.join("/")}`
        const previous = opened.get(xml)
        if (previous !== undefined) throw new Error(`XML-граница ${xml.path} открыта повторно: ${previous} → ${address}`)
        opened.set(xml, address)
        const inherited = parent.find(({ source }) => isInside(source, xml))
        return {
          key: `source-${index}`,
          source: xml,
          proof: inherited?.proof ?? params.prepareRootProof?.({ key: `source-${index}`, source: xml }) ?? createLocalXmlProof(),
        }
      })
      preparedByYaml.set(item.yaml, sources)
      return {
        context: { ...item.context, exportToXML: params.context.exportToXML },
        annotations: params.annotations,
        name: item.itemName,
        sourceItemName: item.itemName,
        outputs: sources.map(({ key, source }, index) => ({
          key,
          tags: item.sources[index]?.tags,
          referenceXML: source.compatibilityValue,
          ...(parent.length !== 0 || params.prepareRootContext === undefined
            ? {}
            : { context: params.prepareRootContext({ key, source }) }),
          itemPreparation: withSourceTransportAttributes(
            parent.length !== 0 || params.prepareRootOutput === undefined
              ? undefined
              : params.prepareRootOutput({ key, source }),
            source,
          ),
        })),
      }
    },
    beforeFinish({ yaml, rule, root }) {
      params.finalizeRootYaml?.(yaml, rule)
      if (!root) return
      const decisions = params.selectDecisions?.(yaml, rule) ?? params.decisions
      if (decisions.length === 0) return
      applyImportedIssueDecisions({
        data: yaml,
        annotations: params.annotations,
        decisions,
      })
    },
    consumer({ yaml, rule }, receipts, prepared) {
      const sources = preparedByYaml.get(yaml)
      if (sources === undefined) throw new Error("Не подготовлены XML-границы локального proof")
      preparedByYaml.delete(yaml)
      active.push(sources)
      const delegate = createAnnotatedLocalXmlBodyConsumers({
        sources: sources.map((source) => ({
          ...source,
          itemPreparation: prepared.outputs.find(({ key }) => key === source.key)?.itemPreparation,
          xmlEnvelope: prepared.outputs.find(({ key }) => key === source.key)?.xmlEnvelope,
        })),
        yaml,
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
          }
        },
      }
    },
  })
  return {
    ...execution,
    accepts(sources) { return sources.every(({ xml }) => isXmlElementNode(xml)) },
    takeResult(yaml) { return execution.takeResult(yaml) },
    retainReceipt(receipt) { return execution.retainReceipt(receipt) },
    release(yaml) { execution.takeResult(yaml) },
  }
}

const TRANSPORT_ATTRIBUTE = /^(?:id|uuid|version|xmlns(?::.*)?)$/u

function withSourceTransportAttributes(
  preparation: XMLItemOutputPreparation | undefined,
  source: XmlElementNode,
): XMLItemOutputPreparation | undefined {
  const retained = Object.fromEntries(source.attributes
    .filter(({ name }) => TRANSPORT_ATTRIBUTE.test(name))
    .map(({ name, value }) => [`_${name}`, value]))
  if (Object.keys(retained).length === 0) return preparation
  return {
    attributes: (own) => {
      const result = { ...(preparation?.attributes(own) ?? own) }
      for (const key of Object.keys(result)) {
        if (key.startsWith("_") && TRANSPORT_ATTRIBUTE.test(key.slice(1))) delete result[key]
      }
      for (const [key, value] of Object.entries(retained)) {
        result[key] = value
      }
      return result
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
