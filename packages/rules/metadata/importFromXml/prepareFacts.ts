import type {
  ConfigurationIndexBlockFragment,
  ConfigurationIndexCollector,
  ExternalFileEntry,
  XmlImportConfigurationContext,
} from "@nkdk/runtime"
import {
  childSegmentUid,
  createConfigurationIndexCollector,
  withConfigurationIndexCollector,
  yamlScalarTagAt,
  markYAMLScalarTag,
  yamlPathToPointer,
} from "@nkdk/runtime"
import type {
  DirectImportFactsSink,
  ImportedDependentPropertyCandidate,
  LocalIndexes,
  MetadataItemRule,
} from "@nkdk/runtime/rule-kit"
import { importClientApplicationFormFromXMLToYAML } from "../forms/clientApplicationForm/fromXMLToYAML"
import { importClientApplicationFormBodyFromXML } from "../forms/clientApplicationForm/fromXMLToYAML"
import { clientApplicationFormDataPathProjection } from "../forms/clientApplicationForm/formDataPathProjection"
import { createFormDataPathIndexFromFacts } from "./formDataPathFacts"
import { collectFormDataPathOccurrencesFromFacts } from "./formDataPathOccurrences"
import { selectDependentValidationFacts } from "./dependentValidationFacts"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import { formMetadataSource } from "../forms/clientApplicationForm/metadataXML"
import { importMetadataItemFromXMLToYAML } from "../ruleRuntime/metadataItem/fromXMLToYAML"
import {
  createDeferredValuePathCollector,
  createDirectImportFactsCollector,
  createImportedDependentPropertyCollector,
} from "@nkdk/runtime/rule-kit"
import { createLocalIndexesCollector } from "../projectDefinition/localIndexes"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import type { MetadataItemOwnerContextEntry } from "../ruleRuntime/appliedObject/metadataItemOwnerContext"
import type { ValidationProfiler } from "../validation/profile"
import {
  createResolvedAssignmentImportEnvironment,
  mapExternalPropertyXmlInputs,
  resolveBaseFormCompanion,
  requireMetadataXmlNode,
  type ParsedImportXmlInput,
} from "./prepareYaml"
import type { ImportAssignment, ParsedImportXmlDocument } from "./types"
import { toDataPathPolicyInput } from "../validation/dataPath/policies"
import type { ValidationPendingCheck } from "../validation/projectValidationPendingChecks"
import type { PendingMetadataTargetReference } from "../validation/projectReferenceIndex"
import { extractDependentYamlIndexFacts } from "../validation/yamlFactExtractor"
import { collectImportDependencyFacts, type ImportDependencyFacts } from "./preparedDependencies"
import { resolveDeferredPropertyRule } from "../ruleRuntime/property/finalizeImportedYAML"
import {
  applyMetadataItemXmlImportAugmenter,
  metadataItemXmlImportYamlDependencies,
  resolveMetadataItemXMLDefaultVariant,
  withResolvedXMLImportObjectVariant,
} from "../ruleRuntime/metadataItem/augmenterRegistry"
import { getTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import {
  propertyFactsWithReconstructionValues,
  type DirectImportPropertyFact,
} from "./propertyFactsYamlView"
import { selectImportPropertyPaths } from "./selectedPropertyFacts"

export interface PreparedImportFacts {
  readonly dependencies: ImportDependencyFacts
  readonly baseFormDependencies?: ImportDependencyFacts
  readonly assignment: ImportAssignment
  readonly targetProjectPath: string
  readonly rule: MetadataItemRule
  readonly ownerContext: readonly MetadataItemOwnerContextEntry[]
  readonly dependentOwner: { readonly dir: string; readonly name: string }
  readonly localIndexes: LocalIndexes
  readonly configurationFragment: ConfigurationIndexBlockFragment
  readonly generatedFiles: readonly ExternalFileEntry[]
  readonly semanticFacts: readonly DirectImportPropertyFact[]
  readonly formSemanticFacts?: readonly DirectImportPropertyFact[]
  readonly baseFormSemanticFacts?: readonly DirectImportPropertyFact[]
  readonly baseFormDataPathIndex?: ReturnType<typeof createFormDataPathIndexFromFacts>
  readonly deferred: readonly import("@nkdk/runtime/rule-kit").DeferredValuePath[]
  readonly baseFormDeferred?: readonly import("@nkdk/runtime/rule-kit").DeferredValuePath[]
  readonly pendingReferences: readonly PendingMetadataTargetReference[]
  readonly pendingChecks: readonly ValidationPendingCheck[]
}

type ParsedFactsXmlInput = ParsedImportXmlInput

export async function prepareImportFacts(params: {
  readonly assignment: ImportAssignment
  readonly context: XmlImportConfigurationContext
  readonly collector: ConfigurationIndexCollector
  readonly inputs: readonly ParsedImportXmlDocument[]
  readonly topology?: CompiledMetadataResourceTopology
  readonly profiler?: ValidationProfiler
  readonly execution?: import("@nkdk/runtime/rule-kit").CompiledPropertyRuleExecution
}): Promise<PreparedImportFacts> {
  const inputs = parsedInputs(params.inputs)
  const {
    generatedFiles,
    rule,
    ownerContext,
    importContext,
    dependentOwner,
  } = createResolvedAssignmentImportEnvironment({
    assignment: params.assignment,
    context: params.context,
    collector: params.collector,
    topology: params.topology,
  })
  const facts = createDirectImportFactsCollector()
  let dependentCandidates: readonly ImportedDependentPropertyCandidate[] = []
  let baseFormSemanticFacts: readonly DirectImportPropertyFact[] | undefined
  let baseFormDataPathIndex: PreparedImportFacts["baseFormDataPathIndex"]
  let baseFormDependencies: ImportDependencyFacts | undefined
  let baseFormDeferred: readonly import("@nkdk/runtime/rule-kit").DeferredValuePath[] | undefined

  const imported = measureFacts(params.profiler, () => {
    if (rule.itemType === ClientApplicationFormRules.itemType) {
      const body = inputs.find(({ input }) => input.role === "body")
      const importedForm = importClientApplicationFormFromXMLToYAML({
        context: importContext,
        formName: params.assignment.itemName,
        formXML: body?.document.roots.find(({ name }) => name === "Form"),
        metadataXML: requireMetadataXmlNode(inputs),
        rule,
        mode: "facts",
        produceResult: false,
        facts,
      })
      return importedForm
    }

    const localIndexesCollector = createLocalIndexesCollector()
    const dependent = createImportedDependentPropertyCollector()
    const metadata = requireInput(inputs, "metadata")
    const externalPropertyXml = mapExternalPropertyXmlInputs(rule, inputs)
    importMetadataItemFromXMLToYAML({
      context: importContext,
      rule,
      name: params.assignment.itemName,
      xml: requireMetadataXmlNode(inputs),
      traversal: {
        mode: "facts",
        produceResult: false,
        facts,
        yamlPath: [],
        rulePath: [],
        collector: localIndexesCollector,
        dependent,
        xmlNodes: metadata.document.roots,
      },
      propertyXML: externalPropertyXml.valuesByPropertyKey,
      propertyXMLNodes: externalPropertyXml.nodesByPropertyKey,
    })
    dependentCandidates = dependent.finish()
    return {
      yaml: undefined,
      localIndexes: localIndexesCollector.finish(),
      deferred: [],
      generatedFiles: [],
    }
  })

  if (baseFormSemanticFacts === undefined) {
    const supportsClientApplicationForm = rule.itemType === ClientApplicationFormRules.itemType
      || Object.values(rule.properties).some(({ type }) => type === "ClientApplicationForm")
    const body = inputs.find(({ input }) => input.role === "body")
    const baseFormNode = body?.document.roots
      .find(({ name }) => name === "Form")?.content
      .find((node): node is import("@nkdk/runtime").XmlElementNode =>
        node.type === "element" && node.name === "BaseForm")
    const companion = supportsClientApplicationForm
      ? resolveBaseFormCompanion(params.assignment, params.topology)
      : undefined
    if (baseFormNode !== undefined && companion !== undefined) {
      const baseFacts = createDirectImportFactsCollector()
      const baseIndexesCollector = createLocalIndexesCollector()
      const baseDeferred = createDeferredValuePathCollector()
      importClientApplicationFormBodyFromXML({
        context: withConfigurationIndexCollector(
          importContext,
          createConfigurationIndexCollector(),
          childSegmentUid(params.assignment.logicalAddress, "ОсноваФормы"),
        ),
        formName: params.assignment.itemName,
        formXML: baseFormNode,
        collector: baseIndexesCollector,
        deferred: baseDeferred,
        rule: companion.rule,
        mode: "facts",
        produceResult: false,
        facts: baseFacts,
      })
      const baseIndexes = baseIndexesCollector.finish()
      baseFormDeferred = baseDeferred.finish()
      const basePropertyFacts = baseFacts.finish()
      baseFormSemanticFacts = acceptedPropertyFacts(baseIndexes, basePropertyFacts)
      baseFormDataPathIndex = createFormDataPathIndexFromFacts({
        facts: propertyFactsWithReconstructionValues(baseFormSemanticFacts),
        localIndexes: baseIndexes,
        projection: clientApplicationFormDataPathProjection,
      })
      baseFormDependencies = collectImportDependencyFacts({
        yaml: undefined,
        rule: companion.rule,
        owner: dependentOwner,
        candidates: [],
        propertyFacts: baseFormSemanticFacts,
        proofPropertyFacts: basePropertyFacts,
        ...(params.execution === undefined ? {} : { execution: params.execution }),
      })
    }
  }

  const propertyFacts = facts.finish()
  const acceptedFacts = rule.itemType === ClientApplicationFormRules.itemType
    ? augmentClientApplicationFormFacts({
        facts: acceptedPropertyFacts(imported.localIndexes, propertyFacts),
        inputs,
        context: importContext,
        rule,
      })
    : acceptedPropertyFacts(imported.localIndexes, propertyFacts)
  const formPropertyYaml = Object.values(rule.properties)
    .find(({ type }) => type === "ClientApplicationForm")?.yaml
  const containsForm = rule.itemType === ClientApplicationFormRules.itemType || typeof formPropertyYaml === "string"
  const preliminaryFormDataPathIndex = containsForm
    ? createFormDataPathIndexFromFacts({ facts: acceptedFacts, localIndexes: imported.localIndexes, projection: clientApplicationFormDataPathProjection })
    : undefined
  const semanticFacts = finalizeDeferredPropertyFacts({
    facts: acceptedFacts,
    deferred: imported.deferred,
    rootRule: rule,
    context: importContext,
    formDataPathIndex: preliminaryFormDataPathIndex,
    execution: params.execution,
  })
  const formSemanticFacts = containsForm ? semanticFacts : undefined
  const dependentIndex = extractDependentYamlIndexFacts({
    filePath: params.assignment.targetProjectPath,
    rootYaml: selectDependentValidationFacts({
      rule, owner: dependentOwner, candidates: dependentCandidates, facts: semanticFacts,
      execution: params.execution,
    }),
    rootRule: rule,
    owner: dependentOwner,
    candidates: dependentCandidates,
  })
  const formPendingChecks = containsForm ? prepareFormValidationChecks({
    assignment: params.assignment,
    rule,
    localIndexes: imported.localIndexes,
    facts: semanticFacts,
    owner: dependentOwner,
  }) : []

  return {
    dependencies: collectImportDependencyFacts({
      yaml: undefined,
      rule,
      owner: dependentOwner,
      candidates: dependentCandidates,
      propertyFacts: semanticFacts,
      proofPropertyFacts: propertyFacts,
      finalPropertyFacts: semanticFacts,
      ...(params.execution === undefined ? {} : { execution: params.execution }),
    }),
    ...(baseFormDependencies === undefined ? {} : { baseFormDependencies }),
    assignment: params.assignment,
    targetProjectPath: params.assignment.targetProjectPath,
    rule,
    ownerContext,
    dependentOwner,
    localIndexes: imported.localIndexes,
    configurationFragment: params.collector.fragment(params.assignment.targetProjectPath),
    generatedFiles: [...generatedFiles, ...imported.generatedFiles.filter((file) => !generatedFiles.includes(file))],
    semanticFacts,
    ...(formSemanticFacts === undefined ? {} : { formSemanticFacts }),
    ...(baseFormSemanticFacts === undefined ? {} : { baseFormSemanticFacts }),
    ...(baseFormDataPathIndex === undefined ? {} : { baseFormDataPathIndex }),
    deferred: imported.deferred,
    ...(baseFormDeferred === undefined ? {} : { baseFormDeferred }),
    pendingReferences: dependentIndex.pendingReferences,
    pendingChecks: [
      ...dependentIndex.pendingChecks,
      ...formPendingChecks,
    ],
  }
}

function augmentClientApplicationFormFacts(params: {
  readonly facts: readonly DirectImportPropertyFact[]
  readonly inputs: readonly ParsedFactsXmlInput[]
  readonly context: XmlImportConfigurationContext
  readonly rule: MetadataItemRule
}): readonly DirectImportPropertyFact[] {
  if (!("metadataItemAugmenter" in params.context.fromXML)
    || typeof params.context.fromXML.metadataItemAugmenter !== "string") return params.facts
  const metadataObject = requireMetadataXmlNode(params.inputs)
  const source = formMetadataSource(metadataObject) ?? {}
  const context = withResolvedXMLImportObjectVariant(
    params.context,
    resolveMetadataItemXMLDefaultVariant({ context: params.context, rule: params.rule, source }),
  )
  const selected = selectImportPropertyPaths(params.facts, new Map(
    metadataItemXmlImportYamlDependencies({ context, rule: params.rule, source }).map(key => [key, [key]]),
  ))
  const before = Object.fromEntries([...selected].map(([key, entry]) => [key, entry.value]))
  const yaml = { ...before }
  for (const [key, entry] of selected) if (entry.scalarTag !== undefined) markYAMLScalarTag(yaml, key, entry.scalarTag)
  applyMetadataItemXmlImportAugmenter({ context, rule: params.rule, source, yaml })
  const result = [...params.facts]
  for (const [key, value] of Object.entries(yaml)) {
    if ((value === null || typeof value !== "object")
      && Object.hasOwn(before, key) && Object.is(before[key], value)
      && selected.get(key)?.scalarTag === yamlScalarTagAt(yaml, key)) continue
    appendAugmentedFacts(result, params.rule, key, [key], value, yamlScalarTagAt(yaml, key))
  }
  return result
}

function appendAugmentedFacts(
  target: DirectImportPropertyFact[],
  rule: MetadataItemRule,
  rootKey: string,
  yamlPath: readonly (string | number)[],
  value: unknown,
  scalarTag?: import("@nkdk/runtime").YAMLScalarTag,
): void {
  if (Array.isArray(value) && value.length > 0) {
    if (scalarTag !== undefined) {
      target.push({
        itemType: rule.itemType,
        itemRule: rule,
        propertyKey: `$augment:${rootKey}`,
        yamlPath,
        sourceYamlPath: yamlPath,
        value: [],
        scalarTag,
      })
    }
    value.forEach((child, index) => {
      appendAugmentedFacts(target, rule, rootKey, [...yamlPath, index], child)
    })
    return
  }
  if (value !== null && typeof value === "object" && Object.keys(value).length > 0) {
    if (scalarTag !== undefined) {
      target.push({
        itemType: rule.itemType,
        itemRule: rule,
        propertyKey: `$augment:${rootKey}`,
        yamlPath,
        sourceYamlPath: yamlPath,
        value: {},
        scalarTag,
      })
    }
    for (const [key, child] of Object.entries(value)) {
      appendAugmentedFacts(target, rule, rootKey, [...yamlPath, key], child)
    }
    return
  }
  target.push({
    itemType: rule.itemType,
    itemRule: rule,
    propertyKey: `$augment:${rootKey}`,
    yamlPath,
    sourceYamlPath: yamlPath,
    value,
    ...(scalarTag === undefined ? {} : { scalarTag }),
  })
}

function prepareFormValidationChecks(params: {
  readonly assignment: ImportAssignment
  readonly rule: MetadataItemRule
  readonly localIndexes: LocalIndexes
  readonly facts: readonly DirectImportPropertyFact[]
  readonly owner: { readonly dir: string; readonly name: string }
}): ValidationPendingCheck[] {
  const index = createFormDataPathIndexFromFacts({ facts: params.facts, localIndexes: params.localIndexes, projection: clientApplicationFormDataPathProjection })
  params.localIndexes.metadata.formDataPathIndex = index
  if (params.rule.itemType !== ClientApplicationFormRules.itemType) return []
  return prepareImportedFormDataPathChecks({
    occurrences: collectFormDataPathOccurrencesFromFacts({ facts: params.facts, projection: clientApplicationFormDataPathProjection }),
    index,
    owner: { kind: params.owner.dir, name: params.owner.name },
    targetProjectPath: params.assignment.targetProjectPath,
  })
}

function prepareImportedFormDataPathChecks(params: {
  readonly occurrences: ReturnType<typeof collectFormDataPathOccurrencesFromFacts>
  readonly index: NonNullable<LocalIndexes["metadata"]["formDataPathIndex"]>
  readonly owner: { readonly kind: string; readonly name: string }
  readonly targetProjectPath: string
}): ValidationPendingCheck[] {
  return params.occurrences.map((occurrence) => ({
    kind: "dataPath",
    yamlPath: [...occurrence.yamlPath],
    location: {
      filePath: params.targetProjectPath,
      line: 1,
      col: 1,
      path: yamlPathToPointer(occurrence.yamlPath),
    },
    owner: params.owner,
    value: occurrence.value,
    index: params.index,
    policyInput: toDataPathPolicyInput(occurrence.rule),
    ...(occurrence.elementType === undefined ? {} : { elementType: occurrence.elementType }),
    ...(occurrence.hasValuesPicture === true ? { hasValuesPicture: true } : {}),
    ...(occurrence.tableContext === undefined ? {} : { tableContext: occurrence.tableContext }),
    policy: "formDataPath",
  }))
}

interface PropertyFactSlot {
  fact?: DirectImportPropertyFact
  descendants?: DirectImportPropertyFact[]
}

interface PropertyFactPathNode {
  children?: Map<string | number, PropertyFactPathNode>
  properties?: Map<string, PropertyFactSlot>
  containerIndex?: number
}

export function acceptedPropertyFacts(
  indexes: LocalIndexes,
  propertyFacts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): Parameters<DirectImportFactsSink["acceptProperty"]>[0][] {
  const root: PropertyFactPathNode = {}
  const latest: PropertyFactSlot[] = []
  for (const [index, fact] of propertyFacts.entries()) {
    const node = ensurePropertyFactPath(root, fact.yamlPath)
    const key = fact.propertyKey
    const slot = ensurePropertyFactSlot(node, key)
    if (slot.fact === undefined) latest.push(slot)
    slot.fact = fact
    if (key.startsWith("$container:")) node.containerIndex = index
  }
  const boundaries: DirectImportPropertyFact[][] = []
  for (const event of indexes.metadata.events) {
    if (event.kind !== "property") continue
    const key = event.rulePath.at(-1)?.propertyKey
    if (key === undefined) continue
    const slot = ensurePropertyFactSlot(ensurePropertyFactPath(root, event.yamlPath), key)
    boundaries.push(slot.descendants ??= [])
  }
  for (const slot of latest) {
    const fact = slot.fact!
    const propertyKey = fact.propertyKey
    if (propertyKey.startsWith("$")) continue
    let node = root
    for (const segment of fact.yamlPath) {
      node = node.children!.get(segment)!
      node.properties?.get(propertyKey)?.descendants?.push(fact)
    }
  }
  const result: Parameters<DirectImportFactsSink["acceptProperty"]>[0][] = []
  for (const [index, fact] of propertyFacts.entries()) {
    if (fact.propertyKey === "$formElementKind") result.push(fact)
    if (!fact.propertyKey.startsWith("$container:")) continue
    let node = root
    let superseded = false
    for (let position = 0; position < fact.yamlPath.length; position++) {
      node = node.children!.get(fact.yamlPath[position]!)!
      if (position < fact.yamlPath.length - 1 && node.containerIndex !== undefined && node.containerIndex > index) {
        superseded = true
        break
      }
    }
    if (!superseded && node.containerIndex === index) result.push(fact)
  }
  for (const facts of boundaries) result.push(...facts)
  return result
}

function ensurePropertyFactPath(root: PropertyFactPathNode, path: readonly (string | number)[]): PropertyFactPathNode {
  let node = root
  for (const segment of path) {
    const children = node.children ??= new Map()
    let child = children.get(segment)
    if (child === undefined) {
      child = {}
      children.set(segment, child)
    }
    node = child
  }
  return node
}

function ensurePropertyFactSlot(node: PropertyFactPathNode, key: string): PropertyFactSlot {
  const properties = node.properties ??= new Map()
  let slot = properties.get(key)
  if (slot === undefined) {
    slot = {}
    properties.set(key, slot)
  }
  return slot
}

export function finalizeDeferredPropertyFacts(params: {
  readonly facts: readonly DirectImportPropertyFact[]
  readonly deferred: readonly import("@nkdk/runtime/rule-kit").DeferredValuePath[]
  readonly rootRule: MetadataItemRule
  readonly context: XmlImportConfigurationContext
  readonly formDataPathIndex: LocalIndexes["metadata"]["formDataPathIndex"]
  readonly execution?: import("@nkdk/runtime/rule-kit").CompiledPropertyRuleExecution
}): readonly DirectImportPropertyFact[] {
  const deferredByPath = new Map(params.deferred.map(value => [yamlPathToPointer(value.valuePath), value]))
  // Внешний XML item передаёт адресные факты без отдельной очереди deferred.
  // Его зарегистрированный предикат определяет необходимость финализации.
  const finalizedByPath = new Map<ReturnType<typeof yamlPathToPointer>, unknown>()
  for (const fact of params.facts) {
    const deferred = deferredByPath.size === 0 ? undefined : deferredByPath.get(yamlPathToPointer(fact.yamlPath))
    const rule = deferred === undefined
      ? fact.itemRule?.properties[fact.propertyKey]
      : resolveDeferredPropertyRule(params.rootRule, deferred.rulePath, params.execution)
    if (rule === undefined) continue
    const finalize = params.execution === undefined
      ? getTypeRule(rule.type, "finalizeImportedYAML")
      : params.execution.getTypeRule(rule.type, "finalizeImportedYAML")
    if (finalize === undefined) {
      if (deferred !== undefined) throw new Error(`Для типа ${rule.type} не зарегистрирован finalizeImportedYAML`)
      continue
    }
    const requiresFinalization = params.execution === undefined
      ? getTypeRule(rule.type, "requiresImportedYAMLFinalization")
      : params.execution.getTypeRule(rule.type, "requiresImportedYAMLFinalization")
    if (deferred === undefined && (requiresFinalization === undefined || !requiresFinalization({ value: fact.value }))) continue
    const finalizedValue = finalize({
      context: params.context,
      rule,
      value: fact.value,
      ...(params.formDataPathIndex === undefined ? {} : { formDataPathIndex: params.formDataPathIndex }),
    })
    finalizedByPath.set(yamlPathToPointer(fact.yamlPath), finalizedValue)
  }
  if (finalizedByPath.size === 0) return params.facts
  // Один адрес может присутствовать как факт свойства и как лист контейнера.
  // Ни одна из этих проекций не должна перекрыть окончательное значение старым.
  return params.facts.map(fact => {
    const key = yamlPathToPointer(fact.yamlPath)
    return finalizedByPath.has(key) ? { ...fact, value: finalizedByPath.get(key) } : fact
  })
}

function parsedInputs(inputs: readonly ParsedImportXmlDocument[]): ParsedFactsXmlInput[] {
  return inputs.map(({ input, document }) => ({
    input,
    document,
    roots: document.roots,
  }))
}

function requireInput(
  inputs: readonly ParsedFactsXmlInput[],
  role: ParsedImportXmlDocument["input"]["role"],
): ParsedFactsXmlInput {
  const input = inputs.find((candidate) => candidate.input.role === role)
  if (input === undefined) throw new Error(`В задании XML-import отсутствует ${role} XML`)
  return input
}

function measureFacts<T>(profiler: ValidationProfiler | undefined, action: () => T): T {
  if (profiler === undefined) return action()
  return profiler.measure(
    "Подготовка импорта конфигурации",
    "Извлечение фактов XML",
    { items: 1 },
    action,
  )
}
