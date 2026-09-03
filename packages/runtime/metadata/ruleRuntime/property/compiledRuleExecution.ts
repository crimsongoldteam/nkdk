import type { CompiledPropertyPlan, CompiledPropertyRuleExecution } from "./compiledPropertyPlan"
import type { DirectImportRoundTripExecution } from "./importYamlTypes"
import type { YAMLToXMLItemConversionParams, YAMLToXMLResult, YAMLToXMLExternalWrite } from "./fromYAMLToXMLTypes"
import { createXMLPropertyExecution, type XMLPropertyExecutionObserver } from "./xmlPropertyExecution"
import type { LocalXmlChild } from "../xmlAnomaly/localProof"
import type { MetadataItemRule } from "./types"
import { prepareMetadataItemXMLExecution } from "../metadataItem/fromYAMLToXML"

type ImportItem = Parameters<DirectImportRoundTripExecution["open"]>[0]

export interface CompiledXMLProofResult {
  readonly roots: ReadonlyMap<string, LocalXmlChild>
  readonly externalWrites: readonly YAMLToXMLExternalWrite[]
}

export interface CompiledXMLProofConsumer {
  write(event: Parameters<XMLPropertyExecutionObserver["write"]>[0]): void
  complete?: XMLPropertyExecutionObserver["complete"]
  /** На выходе только вклады корней; контрольные значения не сохраняются. */
  finish(output: YAMLToXMLResult): ReadonlyMap<string, LocalXmlChild>
}

export function createCompiledRuleExecution(params: {
  readonly execution: CompiledPropertyRuleExecution
  readonly prepare: (item: ImportItem) => Omit<YAMLToXMLItemConversionParams, "rule" | "yaml">
  readonly consumer: (item: ImportItem, children: {
    childReceipt(value: unknown): LocalXmlChild | undefined
  }, prepared: YAMLToXMLItemConversionParams) => CompiledXMLProofConsumer
}): DirectImportRoundTripExecution & { takeResult(yaml: object): CompiledXMLProofResult } {
  const completed = new WeakMap<object, { readonly rule: MetadataItemRule; readonly result: CompiledXMLProofResult }>()
  // Идентичность границы переносится штатным копированием служебных меток YAML.
  // Ключ не содержит ни исходного YAML, ни контрольного XML и живёт только в этом запуске.
  const identity = Symbol("compiledXMLBoundary")
  const markers = new WeakMap<object, LocalXmlChild>()
  const active: { readonly plan: CompiledPropertyPlan }[] = []
  const children = {
    childReceipt(value: unknown): LocalXmlChild | undefined {
      return value !== null && typeof value === "object" ? markers.get(value) : undefined
    },
  }
  const transport = (result: CompiledXMLProofResult): YAMLToXMLResult => ({
    outputs: new Map([...result.roots].map(([key, receipt]) => {
      const marker = {}
      markers.set(marker, receipt)
      return [key, marker]
    })),
    deferredByOutput: new Map(),
    externalWrites: result.externalWrites,
  })
  const take = (yaml: object) => {
    const key = (yaml as { readonly [identity]?: object })[identity]
    if (key === undefined) throw new Error("Для XML item не подготовлена идентичность границы")
    const entry = completed.get(key)
    if (entry === undefined) throw new Error("XML item ещё не закрыт или его вклад уже получен")
    completed.delete(key)
    return entry
  }
  return {
    open(source) {
      const identityKey = {}
      Object.defineProperty(source.yaml, identity, { value: identityKey })
      const propertyKey = source.rulePath.at(-1)?.propertyKey
      const ownerProperty = propertyKey === undefined ? undefined : active.at(-1)?.plan.propertiesByKey.get(propertyKey)
      const prepared = prepareMetadataItemXMLExecution({
        ...params.prepare(source), rule: source.rule, yaml: source.yaml,
        prepareOutput: ownerProperty?.operations.prepareXMLItemOutput,
        propertyRule: ownerProperty?.propertyRule,
      }, source.yaml).properties
      const consumer = params.consumer(source, children, prepared)
      const plan = params.execution.propertyPlan(source.rule)
      const frame = { plan }
      const item = createXMLPropertyExecution({
        ...prepared, execution: params.execution, rule: source.rule, yaml: source.yaml,
      }, undefined, {
        reuseNested(nested) {
          if (nested.yaml === null || typeof nested.yaml !== "object") {
            throw new Error("Для XML item не подготовлен объект YAML")
          }
          const entry = take(nested.yaml)
          if (entry.rule !== nested.rule) throw new Error("Правило закрытого XML item не совпадает с правилом родителя")
          return transport(entry.result)
        },
        write(event) {
          consumer.write(event)
          return { retainedValue: {} }
        },
        complete(property) { consumer.complete?.(property) },
        finish(output) {
          if ([...output.deferredByOutput.values()].some((values) => values.length > 0)) {
            throw new Error("Нельзя закрыть XML item с отложенными значениями")
          }
          const result = { roots: consumer.finish(output), externalWrites: output.externalWrites }
          completed.set(identityKey, { rule: source.rule, result })
          return transport(result)
        },
      })
      active.push(frame)
      return {
        ready({ propertyKey }) {
          const property = plan.propertiesByKey.get(propertyKey)
          if (property === undefined) throw new Error(`Не найдено свойство XML item: ${propertyKey}`)
          item.execute(property)
        },
        finish() {
          if (active.at(-1) !== frame) throw new Error("XML item закрывается вне порядка вложенности")
          try { item.finish() } finally { active.pop() }
        },
      }
    },
    takeResult(yaml) { return take(yaml).result },
  }
}
