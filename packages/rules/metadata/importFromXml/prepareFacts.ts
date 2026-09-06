import type {
  ConfigurationIndexBlockFragment,
  ConfigurationIndexCollector,
  ExternalFileEntry,
  XmlDocument,
  XmlImportConfigurationContext,
} from "@nkdk/runtime"
import {
  childSegmentUid,
  createConfigurationIndexCollector,
  withConfigurationIndexCollector,
  yamlScalarTagAt,
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
import {
  createImportedFormDataPathIndex,
  importedClientApplicationForm,
} from "../forms/clientApplicationForm/formDataPathMetadata"
import { resolveClientApplicationFormCollectionItemRule } from "../forms/clientApplicationForm/formDataPathProjection"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { ClientApplicationFormXML, FormMetadataXML } from "../forms/clientApplicationForm/types"
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
  type ParsedImportXmlInput,
} from "./prepareYaml"
import type { ImportAssignment, ParsedImportXmlDocument } from "./types"
import { collectFormDataPathOccurrencesFromYAML } from "../validation/dataPath/formYamlTraversal"
import { toDataPathPolicyInput } from "../validation/dataPath/policies"
import type { ValidationPendingCheck } from "../validation/projectValidationPendingChecks"
import type { PendingMetadataTargetReference } from "../validation/projectReferenceIndex"
import { extractDependentYamlIndexFacts } from "../validation/yamlFactExtractor"
import { collectImportDependencyFacts, type ImportDependencyFacts } from "./preparedDependencies"
import { resolveDeferredPropertyRule } from "../ruleRuntime/property/finalizeImportedYAML"
import {
  applyMetadataItemXmlImportAugmenter,
  resolveMetadataItemXMLDefaultVariant,
  withResolvedXMLImportObjectVariant,
} from "../ruleRuntime/metadataItem/augmenterRegistry"
import { getTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import {
  createPropertyFactsYamlView,
  type DirectImportPropertyFact,
} from "./propertyFactsYamlView"

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
  readonly deferred: readonly import("@nkdk/runtime/rule-kit").DeferredValuePath[]
  readonly baseFormDeferred?: readonly import("@nkdk/runtime/rule-kit").DeferredValuePath[]
  readonly pendingReferences: readonly PendingMetadataTargetReference[]
  readonly pendingChecks: readonly ValidationPendingCheck[]
}

type ParsedFactsXmlInput = Omit<ParsedImportXmlInput, "document"> & { readonly document: XmlDocument }

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
  let baseFormDependencies: ImportDependencyFacts | undefined
  let baseFormDeferred: readonly import("@nkdk/runtime/rule-kit").DeferredValuePath[] | undefined

  const imported = measureFacts(params.profiler, () => {
    if (rule.itemType === ClientApplicationFormRules.itemType) {
      const metadata = requireInput(inputs, "metadata")
      const body = inputs.find(({ input }) => input.role === "body")
      const importedForm = importClientApplicationFormFromXMLToYAML({
        context: importContext,
        formName: params.assignment.itemName,
        formXML: body?.parsed["Form"] as ClientApplicationFormXML | undefined,
        metadataXML: metadata.parsed["MetaDataObject"] as FormMetadataXML,
        formXMLNode: body?.document.roots.find(({ name }) => name === "Form"),
        metadataXMLNode: metadata.document.roots.find(({ name }) => name === "MetaDataObject"),
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
      xml: metadata.document.roots.find(({ name }) => name === "MetaDataObject")
        ?? metadata.parsed["MetaDataObject"],
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
      propertyXML: externalPropertyXml.compatibilityByPropertyKey,
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
      baseFormDependencies = collectImportDependencyFacts({
        yaml: createPropertyFactsYamlView(baseFormSemanticFacts),
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
  const preliminaryView = createPropertyFactsYamlView(acceptedFacts)
  const preliminaryFormDataPathIndex = createImportedFormDataPathIndex({ yaml: preliminaryView, rule })
  const semanticFacts = finalizeDeferredPropertyFacts({
    facts: acceptedFacts,
    deferred: imported.deferred,
    rootRule: rule,
    context: importContext,
    formDataPathIndex: preliminaryFormDataPathIndex,
    execution: params.execution,
  })
  const semanticView = createPropertyFactsYamlView(semanticFacts)
  const formPropertyYaml = Object.values(rule.properties)
    .find(({ type }) => type === "ClientApplicationForm")?.yaml
  const formSemanticFacts = rule.itemType === ClientApplicationFormRules.itemType
    ? semanticFacts
    : typeof formPropertyYaml === "string"
      ? semanticFacts
      : undefined
  const dependentIndex = extractDependentYamlIndexFacts({
    filePath: params.assignment.targetProjectPath,
    rootYaml: semanticView,
    rootRule: rule,
    owner: dependentOwner,
    candidates: dependentCandidates,
  })
  const formPendingChecks = prepareFormValidationChecks({
    assignment: params.assignment,
    rule,
    localIndexes: imported.localIndexes,
    propertyFacts: semanticFacts,
    owner: dependentOwner,
  })

  return {
    dependencies: collectImportDependencyFacts({
      yaml: semanticView,
      rule,
      owner: dependentOwner,
      candidates: dependentCandidates,
      propertyFacts: acceptedFacts,
      proofPropertyFacts: propertyFacts,
      finalRootYaml: semanticView,
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
}): DirectImportPropertyFact[] {
  const metadata = requireInput(params.inputs, "metadata")
  const metadataObject = metadata.parsed["MetaDataObject"] as FormMetadataXML
  const source = { ...metadataObject.Form }
  const context = withResolvedXMLImportObjectVariant(
    params.context,
    resolveMetadataItemXMLDefaultVariant({ context: params.context, rule: params.rule, source }),
  )
  const before = createPropertyFactsYamlView(params.facts)
  const yaml = Object.fromEntries(Object.keys(before).map(key => [key, before[key]]))
  applyMetadataItemXmlImportAugmenter({ context, rule: params.rule, source, yaml })
  const result = [...params.facts]
  for (const [key, value] of Object.entries(yaml)) {
    if (Object.hasOwn(before, key) && Object.is(before[key], value)) continue
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
  readonly propertyFacts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly owner: { readonly dir: string; readonly name: string }
}): ValidationPendingCheck[] {
  const projection = createPropertyFactsYamlView(acceptedPropertyFacts(params.localIndexes, params.propertyFacts))
  const index = createImportedFormDataPathIndex({ yaml: projection, rule: params.rule })
  if (index === undefined) return []
  params.localIndexes.metadata.formDataPathIndex = index
  if (params.rule.itemType !== ClientApplicationFormRules.itemType) return []
  const form = importedClientApplicationForm({ yaml: projection, rule: params.rule })
  if (form === undefined) return []
  return prepareImportedFormDataPathChecks({
    yaml: form.yaml,
    rule: form.rule,
    index,
    owner: { kind: params.owner.dir, name: params.owner.name },
    targetProjectPath: params.assignment.targetProjectPath,
  })
}

export function prepareImportedFormDataPathChecks(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly index: NonNullable<LocalIndexes["metadata"]["formDataPathIndex"]>
  readonly owner: { readonly kind: string; readonly name: string }
  readonly targetProjectPath: string
}): ValidationPendingCheck[] {
  return collectFormDataPathOccurrencesFromYAML({
    yaml: params.yaml,
    rule: params.rule,
    resolveCollectionItemRule: ({ yaml, propertyRule }) =>
      resolveClientApplicationFormCollectionItemRule({ yaml, propertyRule }),
  }).map((occurrence) => ({
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

function acceptedPropertyFacts(
  indexes: LocalIndexes,
  propertyFacts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): Parameters<DirectImportFactsSink["acceptProperty"]>[0][] {
  const latestByKey = new Map<string, Parameters<DirectImportFactsSink["acceptProperty"]>[0]>()
  for (const fact of propertyFacts) latestByKey.set(propertyFactKey(fact.yamlPath, fact.propertyKey), fact)
  const compactFactsByPropertyRoot = new Map<string, Parameters<DirectImportFactsSink["acceptProperty"]>[0][]>()
  for (const fact of latestByKey.values()) {
    if (fact.propertyKey.startsWith("$")) continue
    for (let length = 1; length <= fact.yamlPath.length; length++) {
      const key = propertyFactKey(fact.yamlPath.slice(0, length), fact.propertyKey)
      const descendants = compactFactsByPropertyRoot.get(key)
      if (descendants === undefined) compactFactsByPropertyRoot.set(key, [fact])
      else descendants.push(fact)
    }
  }
  const latestContainerIndexByPath = new Map<string, number>()
  propertyFacts.forEach((fact, index) => {
    if (fact.propertyKey.startsWith("$container:")) {
      latestContainerIndexByPath.set(JSON.stringify(fact.yamlPath), index)
    }
  })
  const result: Parameters<DirectImportFactsSink["acceptProperty"]>[0][] = []
  for (const [index, fact] of propertyFacts.entries()) {
    if (fact.propertyKey === "$formElementKind") result.push(fact)
    if (!fact.propertyKey.startsWith("$container:")) continue
    const ownLatest = latestContainerIndexByPath.get(JSON.stringify(fact.yamlPath))
    if (ownLatest !== index) continue
    const supersededByAncestor = fact.yamlPath.slice(1).some((_segment, length) => {
      const ancestorIndex = latestContainerIndexByPath.get(JSON.stringify(fact.yamlPath.slice(0, length + 1)))
      return ancestorIndex !== undefined && ancestorIndex > index
    })
    if (!supersededByAncestor) result.push(fact)
  }
  for (const event of indexes.metadata.events) {
    if (event.kind !== "property") continue
    const propertyKey = event.rulePath.at(-1)?.propertyKey
    if (propertyKey === undefined) continue
    const facts = compactFactsByPropertyRoot.get(propertyFactKey(event.yamlPath, propertyKey))
    if (facts !== undefined) result.push(...facts)
  }
  return result
}

export function finalizeDeferredPropertyFacts(params: {
  readonly facts: readonly DirectImportPropertyFact[]
  readonly deferred: readonly import("@nkdk/runtime/rule-kit").DeferredValuePath[]
  readonly rootRule: MetadataItemRule
  readonly context: XmlImportConfigurationContext
  readonly formDataPathIndex: LocalIndexes["metadata"]["formDataPathIndex"]
  readonly execution?: import("@nkdk/runtime/rule-kit").CompiledPropertyRuleExecution
}): DirectImportPropertyFact[] {
  const deferredByPath = new Map(params.deferred.map(value => [yamlPathToPointer(value.valuePath), value]))
  return params.facts.map((fact) => {
    const deferred = deferredByPath.get(yamlPathToPointer(fact.yamlPath))
    if (deferred === undefined) return fact
    const rule = resolveDeferredPropertyRule(params.rootRule, deferred.rulePath, params.execution)
    const finalize = params.execution === undefined
      ? getTypeRule(rule.type, "finalizeImportedYAML")
      : params.execution.getTypeRule(rule.type, "finalizeImportedYAML")
    if (finalize === undefined) throw new Error(`Для типа ${rule.type} не зарегистрирован finalizeImportedYAML`)
    const finalizedValue = finalize({
      context: params.context,
      rule,
      value: fact.value,
      ...(params.formDataPathIndex === undefined ? {} : { formDataPathIndex: params.formDataPathIndex }),
    })
    return {
      ...fact,
      value: finalizedValue,
    }
  })
}

function propertyFactKey(path: readonly (string | number)[], propertyKey: string): string {
  return JSON.stringify([path, propertyKey])
}


function parsedInputs(inputs: readonly ParsedImportXmlDocument[]): ParsedFactsXmlInput[] {
  return inputs.map(({ input, document }) => ({
    input,
    document,
    roots: document.roots,
    parsed: document.compatibility,
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
