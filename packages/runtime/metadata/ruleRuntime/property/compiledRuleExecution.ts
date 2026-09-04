import type { CompiledPropertyPlan, CompiledPropertyRuleExecution } from "./compiledPropertyPlan"
import type { DirectImportRoundTripExecution, DirectImportXMLPropertyBinding } from "./importYamlTypes"
import type { YAMLToXMLItemConversionParams, YAMLToXMLResult, YAMLToXMLExternalWrite } from "./fromYAMLToXMLTypes"
import { createXMLPropertyExecution, prepareNestedXMLPropertyContext, prepareSingletonXMLContext, type XMLPropertyExecutionObserver } from "./xmlPropertyExecution"
import { markLocalXmlBoundary, type LocalXmlChild, type LocalXmlScalar } from "../xmlAnomaly/localProof"
import type { MetadataItemRule } from "./types"
import { prepareMetadataItemXMLExecution } from "../metadataItem/fromYAMLToXML"
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

export const SUPPRESSED_LOCAL_XML_OUTPUT = Symbol("suppressedLocalXmlOutput")
export const RETAINED_LOCAL_XML_OUTPUT = Symbol("retainedLocalXmlOutput")

export interface CompiledXMLProofConsumer {
  /** Прямая привязка импорта, включая alias и отсутствие исходного свойства. */
  bind?(source: DirectImportXMLPropertyBinding): void
  write(event: Parameters<XMLPropertyExecutionObserver["write"]>[0] & {
    /** Вклады закрытых непосредственных детей этого свойства, без поиска в YAML. */
    readonly childReceipts?: readonly LocalXmlChild[]
  }): LocalXmlChild | LocalXmlScalar | typeof SUPPRESSED_LOCAL_XML_OUTPUT | typeof RETAINED_LOCAL_XML_OUTPUT | void
  complete?: XMLPropertyExecutionObserver["complete"]
  /** На выходе только вклады корней; контрольные значения не сохраняются. */
  finish(output: YAMLToXMLResult): ReadonlyMap<string, LocalXmlChild>
}

export function createCompiledRuleExecution(params: {
  readonly execution: CompiledPropertyRuleExecution
  readonly prepare: (item: ImportItem) => Omit<YAMLToXMLItemConversionParams, "rule" | "yaml">
  readonly beforeFinish?: (item: ImportItem & { readonly root: boolean }) => void
  readonly consumer: (item: ImportItem, children: {
    childReceipt(value: unknown): LocalXmlChild | undefined
    scalarReceipt(value: unknown): LocalXmlScalar | undefined
  }, prepared: YAMLToXMLItemConversionParams) => CompiledXMLProofConsumer
}): DirectImportRoundTripExecution & {
  takeResult(yaml: object): CompiledXMLProofResult
  retainReceipt(receipt: LocalXmlChild): object
} {
  const completed = new WeakMap<object, { readonly rule: MetadataItemRule; readonly result: CompiledXMLProofResult }>()
  // Идентичность границы переносится штатным копированием служебных меток YAML.
  // Ключ не содержит ни исходного YAML, ни контрольного XML и живёт только в этом запуске.
  const identity = Symbol("compiledXMLBoundary")
  const markers = new WeakMap<object, LocalXmlChild>()
  const scalarMarkers = new WeakMap<object, LocalXmlScalar>()
  const active: {
    readonly plan: CompiledPropertyPlan
    readonly inline: Map<string, Map<InlineSelector, InlineBindings>>
    readonly prepared: YAMLToXMLItemConversionParams
    readonly childIndices: Map<string, number>
    readonly nestedProperties: Map<string, ReturnType<typeof prepareNestedXMLPropertyContext>>
    readonly childReceipts: Map<string, LocalXmlChild[]>
  }[] = []
  const children = {
    childReceipt(value: unknown): LocalXmlChild | undefined {
      return value !== null && typeof value === "object" ? markers.get(value) : undefined
    },
    scalarReceipt(value: unknown): LocalXmlScalar | undefined {
      return value !== null && typeof value === "object" ? scalarMarkers.get(value) : undefined
    },
  }
  const transport = (result: CompiledXMLProofResult): YAMLToXMLResult => ({
    outputs: new Map([...result.roots].map(([key, receipt]) => {
      const marker = markLocalXmlBoundary({})
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
  const take = (yaml: object, itemType?: string) => {
    const key = (yaml as { readonly [identity]?: object })[identity]
    if (key === undefined) throw new Error(`Для XML item${itemType === undefined ? "" : ` ${itemType}`} не подготовлена идентичность границы`)
    return takeKey(key)
  }
  return {
    open(source) {
      const identityKey = {}
      Object.defineProperty(source.yaml, identity, { value: identityKey })
      const propertyKey = source.rulePath.at(-1)?.propertyKey
      const parent = active.at(-1)
      const ownerProperty = propertyKey === undefined ? undefined : parent?.plan.propertiesByKey.get(propertyKey)
      const supplied = params.prepare(source)
      const propertyValues = new Map(supplied.propertyValues)
      for (const key of Object.keys(source.rule.properties)) {
        const prepared = source.dependencies?.propertyValue?.(source.yamlPath, key)
        if (prepared?.value !== undefined) propertyValues.set(key, prepared.value)
      }
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
      const itemPreparation = prepareMetadataItemXMLExecution({
        ...supplied, context, name, sourceItemName, propertyValues,
        rule: source.rule, yaml: source.yaml,
        prepareOutput: ownerProperty?.operations.prepareXMLItemOutput,
        propertyRule: ownerProperty?.propertyRule,
      }, source.yaml)
      const prepared = itemPreparation.properties
      const consumer = params.consumer(source, children, prepared)
      const dependencyFacts = source.dependencies?.itemFacts?.(source.yamlPath, source.rule.itemType)
      const plan = params.execution.propertyPlan(source.rule)
      const frame = {
        plan, prepared, childIndices: new Map<string, number>(), inline: new Map<string, Map<InlineSelector, InlineBindings>>(),
        nestedProperties: new Map<string, ReturnType<typeof prepareNestedXMLPropertyContext>>(),
        childReceipts: new Map<string, LocalXmlChild[]>(),
      }
      const item = createXMLPropertyExecution({
        ...prepared, execution: params.execution, rule: source.rule, yaml: source.yaml,
      }, undefined, {
        prepareNestedProperty(request) {
          return frame.nestedProperties.get(request.property.propertyKey) ?? prepareNestedXMLPropertyContext(request)
        },
        reuseNested(nested) {
          const deferredKeys = nested.deferredRulePath?.map(({ propertyKey }) => propertyKey) ?? []
          const key = deferredKeys.findLast(candidate => frame.inline.has(candidate)) ?? deferredKeys.at(-1)
          const bindings = key === undefined ? undefined : frame.inline.get(key)
          const collection = key === undefined ? false : plan.propertiesByKey.get(key)?.operations.yamlToXMLNestedRule?.kind === "collection"
          const selector = collection ? nested.name ?? nested.rulePath?.at(-1) : undefined
          const queue = bindings?.get(selector)
          const queuedKey = queue?.keys[queue.next]
          // Нормализация YAML может добавить промежуточный item другого вида.
          // Он не должен потреблять подтверждение следующего реального XML-ребёнка.
          const inlineKey = queuedKey !== undefined && completed.get(queuedKey)?.rule === nested.rule
            ? queuedKey
            : undefined
          if (bindings !== undefined && queue !== undefined && inlineKey !== undefined) {
            queue.next++
            if (queue.next === queue.keys.length) bindings.delete(selector)
          }
          if (
            inlineKey === undefined
            && (
              nested.yaml === null
              || typeof nested.yaml !== "object"
              || (nested.yaml as { readonly [identity]?: object })[identity] === undefined
            )
          ) return undefined
          // Inline YAML может быть скаляром или объектом другого, уже потреблённого ребёнка.
          // Связь задаётся владельцем и адресом элемента, никогда равенством значений.
          const entry = inlineKey === undefined ? take(nested.yaml as object, nested.rule.itemType) : takeKey(inlineKey)
          if (entry.rule !== nested.rule) {
            throw new Error(
              `Правило закрытого XML item ${entry.rule.itemType} не совпадает с правилом родителя ${nested.rule.itemType}`,
            )
          }
          return transport(entry.result)
        },
        write(event) {
          const receipt = consumer.write({
            ...event,
            childReceipts: frame.childReceipts.get(event.property.propertyKey) ?? [],
          })
          if (receipt === SUPPRESSED_LOCAL_XML_OUTPUT) return { retainedValue: undefined }
          if (receipt === RETAINED_LOCAL_XML_OUTPUT) return { retainedValue: event.value }
          const retainedValue = markLocalXmlBoundary({})
          if (receipt !== undefined) {
            if ("type" in receipt) markers.set(retainedValue, receipt)
            else scalarMarkers.set(retainedValue, receipt)
          }
          return { retainedValue }
        },
        complete(property) { consumer.complete?.(property) },
        finish(output) {
          const finalized = itemPreparation.finish(output)
          if ([...finalized.deferredByOutput.values()].some((values) => values.length > 0)) {
            throw new Error("Нельзя закрыть XML item с отложенными значениями")
          }
          const result = { roots: consumer.finish(finalized), externalWrites: finalized.externalWrites }
          completed.set(identityKey, { rule: source.rule, result })
          if (parent !== undefined && propertyKey !== undefined) {
            const receipts = parent.childReceipts.get(propertyKey) ?? []
            receipts.push(...result.roots.values())
            parent.childReceipts.set(propertyKey, receipts)
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
      let lastBinding: DirectImportXMLPropertyBinding | undefined
      const boundProperties = new Set<string>()
      const readyProperties = new Set<string>()
      const bind = (input: DirectImportXMLPropertyBinding) => {
        lastBinding = input
        boundProperties.add(input.propertyKey)
        consumer.bind?.(input)
      }
      return {
        bind,
        ready(input) {
          const { propertyKey } = input
          const property = plan.propertiesByKey.get(propertyKey)
          if (property === undefined) throw new Error(`Не найдено свойство XML item: ${propertyKey}`)
          if (lastBinding !== input) bind(input)
          if (params.beforeFinish === undefined) {
            withPreparedXMLDependencyFacts(source.yaml, dependencyFacts, () => item.execute(property))
          } else {
            readyProperties.add(propertyKey)
          }
        },
        finish() {
          if (active.at(-1) !== frame) throw new Error("XML item закрывается вне порядка вложенности")
          try {
            params.beforeFinish?.({ ...source, root: active.length === 1 })
            if (source.yaml !== null && typeof source.yaml === "object") {
              for (const property of plan.properties) {
                const yamlKey = property.propertyRule.yaml
                const preparedValue = propertyValues.get(property.propertyKey)
                if (
                  typeof yamlKey === "string"
                  && preparedValue !== null
                  && typeof preparedValue === "object"
                  && Object.prototype.hasOwnProperty.call(source.yaml, yamlKey)
                ) {
                  propertyValues.delete(property.propertyKey)
                }
              }
            }
            for (const property of plan.properties) {
              if (!boundProperties.has(property.propertyKey)) {
                const semanticOmitted = source.dependencies
                  ?.propertyValue?.(source.yamlPath, property.propertyKey).present === false
                bind({
                  propertyKey: property.propertyKey,
                  presentInXML: false,
                  ...(semanticOmitted ? { semanticOmitted: true } : {}),
                })
              }
            }
            if (params.beforeFinish !== undefined) {
              for (const property of plan.properties) {
                if (!readyProperties.has(property.propertyKey)) continue
                withPreparedXMLDependencyFacts(source.yaml, dependencyFacts, () => item.execute(property))
              }
            }
            withPreparedXMLDependencyFacts(source.yaml, dependencyFacts, () => item.finish())
          } finally { active.pop() }
        },
      }
    },
    takeResult(yaml) { return take(yaml).result },
    retainReceipt(receipt) {
      const marker = markLocalXmlBoundary({})
      markers.set(marker, receipt)
      return marker
    },
  }
}
