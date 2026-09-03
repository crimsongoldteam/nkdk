import type { CompiledPropertyPlan, CompiledPropertyRuleExecution } from "./compiledPropertyPlan"
import type { DirectImportRoundTripExecution } from "./importYamlTypes"
import type { YAMLToXMLItemConversionParams, YAMLToXMLResult, YAMLToXMLExternalWrite } from "./fromYAMLToXMLTypes"
import { createXMLPropertyExecution, prepareNestedXMLPropertyContext, prepareSingletonXMLContext, type XMLPropertyExecutionObserver } from "./xmlPropertyExecution"
import type { LocalXmlChild } from "../xmlAnomaly/localProof"
import type { MetadataItemRule } from "./types"
import { prepareMetadataItemXMLExecution } from "../metadataItem/fromYAMLToXML"
import { findInlineProperty } from "../metadataItem/yamlInline"
import { prepareMetadataCollectionItemXMLContext } from "../metadataCollection/fromYAMLToXML"
import { withPreparedXMLDependencyFacts } from "./preparedXMLDependencies"

type ImportItem = Parameters<DirectImportRoundTripExecution["open"]>[0]
type InlineSelector = string | number | undefined
interface InlineBindings {
  readonly keys: object[]
  next: number
}

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
  const inlineRules = new WeakMap<MetadataItemRule, boolean>()
  const active: {
    readonly plan: CompiledPropertyPlan
    readonly inline: Map<string, Map<InlineSelector, InlineBindings>>
    readonly prepared: YAMLToXMLItemConversionParams
    readonly childIndices: Map<string, number>
    readonly nestedProperties: Map<string, ReturnType<typeof prepareNestedXMLPropertyContext>>
  }[] = []
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
  const takeKey = (key: object) => {
    const entry = completed.get(key)
    if (entry === undefined) throw new Error("XML item ещё не закрыт или его вклад уже получен")
    completed.delete(key)
    return entry
  }
  const take = (yaml: object) => {
    const key = (yaml as { readonly [identity]?: object })[identity]
    if (key === undefined) throw new Error("Для XML item не подготовлена идентичность границы")
    return takeKey(key)
  }
  return {
    open(source) {
      const identityKey = {}
      Object.defineProperty(source.yaml, identity, { value: identityKey })
      const propertyKey = source.rulePath.at(-1)?.propertyKey
      const parent = active.at(-1)
      const ownerProperty = propertyKey === undefined ? undefined : parent?.plan.propertiesByKey.get(propertyKey)
      let inline = inlineRules.get(source.rule)
      if (inline === undefined) {
        inline = findInlineProperty(source.rule) !== undefined
        inlineRules.set(source.rule, inline)
      }
      const supplied = params.prepare(source)
      let context = supplied.context
      let name = supplied.name
      let sourceItemName = supplied.sourceItemName ?? source.itemName
      const nestedRule = ownerProperty?.operations.yamlToXMLNestedRule
      if (parent !== undefined && ownerProperty !== undefined && nestedRule !== undefined && nestedRule.kind !== "externalFile") {
        const output = parent.prepared.outputs.find(output => output.tags === undefined
          || (ownerProperty.propertyRule.tag !== undefined && output.tags.includes(ownerProperty.propertyRule.tag)))
        let nested = parent.nestedProperties.get(ownerProperty.propertyKey)
        if (nested === undefined) {
          nested = prepareNestedXMLPropertyContext({
            context: output?.context ?? parent.prepared.context, ownerRule: parent.plan.rule,
            ownerName: parent.prepared.name, property: ownerProperty, nestedRule,
          })
          parent.nestedProperties.set(ownerProperty.propertyKey, nested)
        }
        context = nested.context
        if (nested.rule.kind === "collection") {
          const position = source.yamlPath.at(-1)
          const index = typeof position === "number" ? position : parent.childIndices.get(ownerProperty.propertyKey) ?? 0
          parent.childIndices.set(ownerProperty.propertyKey, index + 1)
          name = nested.rule.yamlShape === "array" ? undefined : source.itemName
          context = prepareMetadataCollectionItemXMLContext({
            context, descriptor: nested.rule, yaml: source.yaml, name, index,
            itemRule: source.rule, propertyRule: ownerProperty.propertyRule,
          })
        } else if (nested.rule.kind === "item") {
          const singleton = prepareSingletonXMLContext({
            context, descriptor: nested.rule, yaml: source.yaml,
            ownerName: parent.prepared.name, propertyRule: ownerProperty.propertyRule,
          })
          context = singleton.context
          name = nested.rule.injectOwnerName === true ? parent.prepared.name : undefined
          sourceItemName = singleton.itemName ?? parent.prepared.name
        }
      }
      const prepared = prepareMetadataItemXMLExecution({
        ...supplied, context, name, sourceItemName,
        rule: source.rule, yaml: source.yaml,
        prepareOutput: ownerProperty?.operations.prepareXMLItemOutput,
        propertyRule: ownerProperty?.propertyRule,
      }, source.yaml).properties
      const consumer = params.consumer(source, children, prepared)
      const dependencyFacts = source.dependencies?.itemFacts?.(source.yamlPath, source.rule.itemType)
      const plan = params.execution.propertyPlan(source.rule)
      const frame = {
        plan, prepared, childIndices: new Map<string, number>(), inline: new Map<string, Map<InlineSelector, InlineBindings>>(),
        nestedProperties: new Map<string, ReturnType<typeof prepareNestedXMLPropertyContext>>(),
      }
      const item = createXMLPropertyExecution({
        ...prepared, execution: params.execution, rule: source.rule, yaml: source.yaml,
      }, undefined, {
        prepareNestedProperty(request) {
          return frame.nestedProperties.get(request.property.propertyKey) ?? prepareNestedXMLPropertyContext(request)
        },
        reuseNested(nested) {
          const key = nested.deferredRulePath?.at(-1)?.propertyKey
          const bindings = key === undefined ? undefined : frame.inline.get(key)
          const collection = key === undefined ? false : plan.propertiesByKey.get(key)?.operations.yamlToXMLNestedRule?.kind === "collection"
          const selector = collection ? nested.name ?? nested.rulePath?.at(-1) : undefined
          const queue = bindings?.get(selector)
          const inlineKey = queue?.keys[queue.next]
          if (bindings !== undefined && queue !== undefined && inlineKey !== undefined) {
            queue.next++
            if (queue.next === queue.keys.length) bindings.delete(selector)
          }
          if (inlineKey === undefined && (nested.yaml === null || typeof nested.yaml !== "object")) {
            throw new Error("Для XML item не подготовлен объект YAML")
          }
          // Inline YAML может быть скаляром или объектом другого, уже потреблённого ребёнка.
          // Связь задаётся владельцем и адресом элемента, никогда равенством значений.
          const entry = inlineKey === undefined ? take(nested.yaml as object) : takeKey(inlineKey)
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
          if (inline && parent !== undefined && propertyKey !== undefined) {
            let bindings = parent.inline.get(propertyKey)
            if (bindings === undefined) parent.inline.set(propertyKey, bindings = new Map())
            const nestedRule = ownerProperty?.operations.yamlToXMLNestedRule
            const selector = nestedRule?.kind === "collection"
              ? nestedRule.yamlShape === "array"
                ? source.yamlPath.at(-1) : source.itemName ?? source.yamlPath.at(-1)
              : undefined
            let queue = bindings.get(selector)
            if (queue === undefined) bindings.set(selector, queue = { keys: [], next: 0 })
            queue.keys.push(identityKey)
          }
          return transport(result)
        },
      })
      active.push(frame)
      return {
        ready({ propertyKey }) {
          const property = plan.propertiesByKey.get(propertyKey)
          if (property === undefined) throw new Error(`Не найдено свойство XML item: ${propertyKey}`)
          withPreparedXMLDependencyFacts(source.yaml, dependencyFacts, () => item.execute(property))
        },
        finish() {
          if (active.at(-1) !== frame) throw new Error("XML item закрывается вне порядка вложенности")
          try { withPreparedXMLDependencyFacts(source.yaml, dependencyFacts, () => item.finish()) } finally { active.pop() }
        },
      }
    },
    takeResult(yaml) { return take(yaml).result },
  }
}
