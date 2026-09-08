import fs from "node:fs"
import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  createLocalXmlProof,
  parseXmlDocumentWithSaxes,
  isEmptyXmlElement,
  type XmlAnomalyAnnotationTable,
  type XmlAnomalyAnnotations,
  type XmlDocument,
  type XmlElementNode,
  type XmlRootStructure,
  type ConfigurationContextWithExportToXML,
} from "@nkdk/runtime"
import { withConfigurationIndexCollector } from "@nkdk/runtime"
import type { ConfigurationIndexCollector } from "@nkdk/runtime"
import type { ExternalFileEntry, XmlImportConfigurationContext } from "@nkdk/runtime"
import { importClientApplicationFormFromXMLToYAML } from "../forms/clientApplicationForm/fromXMLToYAML"
import { importBaseFormYaml } from "../forms/clientApplicationForm/baseFormYaml"
import { ClientApplicationFormRules, FormRulesTags } from "../forms/clientApplicationForm/rules"
import type { ClientApplicationFormYAML } from "../forms/clientApplicationForm/types"
import { prepareClientApplicationFormProofContexts, prepareClientApplicationFormProofContextsFromPrepared, prepareClientApplicationFormRootOutput } from "../forms/clientApplicationForm/convertYAMLToXML"
import type { FormDataPathContext } from "../forms/clientApplicationForm/formDataPathContext"
import { importMetadataItemFromXMLToYAML } from "../ruleRuntime/metadataItem/fromXMLToYAML"
import {
  appendMetadataItemOwner,
  type MetadataItemOwnerContextEntry,
  withExportMetadataTargetOwners,
} from "../ruleRuntime/appliedObject/metadataItemOwnerContext"
import { metadataTargetOwnerFromRule } from "../ruleRuntime/property/metadataTargetString"
import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import type { DirectImportProfile, DirectImportResult, PreparedImportDependencies } from "@nkdk/runtime/rule-kit"
import type { CompiledPropertyRuleExecution } from "@nkdk/runtime/rule-kit"
import type { ImportedDependentPropertyCandidate } from "@nkdk/runtime/rule-kit"
import {
  createDeferredValuePathCollector,
  createDirectImportProfile,
  createImportedDependentPropertyCollector,
} from "@nkdk/runtime/rule-kit"
import { bindDeferredObjectValues, type DeferredObjectValue } from "@nkdk/runtime/rule-kit"
import { createLocalIndexesCollector, type LocalIndexes } from "../projectDefinition/localIndexes"
import { findRegisteredProjectRule } from "../projectDefinition/projectSpecRegistry"
import { getMetadataComponentDescriptor } from "../components/descriptor"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import type { ValidationProfiler } from "../validation/profile"
import type { ConfigurationIndexBlockFragment } from "@nkdk/runtime"
import { expandMetadataPathPattern } from "../resourceTopology/core/patterns"
import type { ImportAssignment, ImportXmlInput, ParsedImportXmlDocument } from "./types"
import type { ImportedIssueDecision } from "./classifyImportedIssues"
import { createImportLocalRoundTrip } from "./localRoundTrip"
import {
  normalizeImportedDependentItems,
  partitionImportedDependentItems,
} from "./dependentItems"
import { createImportedFormDataPathIndex } from "../forms/clientApplicationForm/formDataPathMetadata"
import { createBaseFormProofPreparation } from "./baseFormProofPreparation"

export interface PreparedImportYaml {
  assignment: ImportAssignment
  targetProjectPath: string
  yaml: unknown
  annotations: XmlAnomalyAnnotationTable
  rule: MetadataItemRule
  ownerContext: readonly MetadataItemOwnerContextEntry[]
  localIndexes: LocalIndexes
  deferred: readonly DeferredObjectValue[]
  dependentDeferred: readonly ImportedDependentPropertyCandidate[]
  dependentOwner: { readonly dir: string; readonly name: string }
  generatedFiles: ExternalFileEntry[]
  baseFormCandidate?: PreparedBaseFormCandidate
  localProofCompleted?: true
}

export interface PreparedBaseFormCandidate {
  source: "saved" | "projected"
  baseProjectPath: string
  targetProjectPath: string
  owner: { dir: string; name: string }
  yaml: unknown
  annotations: XmlAnomalyAnnotations
  rule: MetadataItemRule
  localIndexes: LocalIndexes
  deferred: readonly DeferredObjectValue[]
  configurationFragment: ConfigurationIndexBlockFragment
  localProofReceipt?: import("@nkdk/runtime/rule-kit").LocalXmlChild
}

interface ImportLocalRoundTripOptions {
  readonly execution: CompiledPropertyRuleExecution
  readonly context: ConfigurationContextWithExportToXML
  readonly decisions: readonly ImportedIssueDecision[]
  readonly selectDecisions?: (
    yaml: Record<string, unknown>,
    rule: MetadataItemRule,
    yamlPath: readonly (string | number)[],
    root: boolean,
    annotations: import("@nkdk/runtime").XmlAnomalyAnnotationTable,
  ) => readonly ImportedIssueDecision[]
  readonly selectBaseFormDecisions?: (
    yaml: Record<string, unknown>,
    rule: MetadataItemRule,
    yamlPath: readonly (string | number)[],
    root: boolean,
    annotations: import("@nkdk/runtime").XmlAnomalyAnnotationTable,
  ) => readonly ImportedIssueDecision[]
  readonly finalizeRootYaml?: (
    yaml: Record<string, unknown>,
    rule: MetadataItemRule,
    annotations: import("@nkdk/runtime").XmlAnomalyAnnotationTable,
    savedBaseYAML: unknown | undefined,
    baseFormCandidate: PreparedBaseFormCandidate | undefined,
  ) => void
  readonly prepareRootProof?: (params: {
    readonly key: string
    readonly source: XmlElementNode
  }) => ReturnType<typeof createLocalXmlProof> | undefined
  readonly prepareRootRawPathPrefix?: NonNullable<
    Parameters<typeof createImportLocalRoundTrip>[0]["prepareRootRawPathPrefix"]
  >
}

export interface ParsedImportXmlInput {
  input: ImportXmlInput
  roots: readonly XmlRootStructure[]
  document: XmlDocument
}

let registeredImportRuleLookupCountValueForTests = 0
const registeredImportRulesByItemType = new Map<string, MetadataItemRule | undefined>()

export function registeredImportRuleLookupCountForTests(): number {
  return registeredImportRuleLookupCountValueForTests
}

export function resetRegisteredImportRuleLookupCountForTests(): void {
  registeredImportRuleLookupCountValueForTests = 0
  registeredImportRulesByItemType.clear()
}

export async function prepareImportYaml(params: {
  dependencies?: PreparedImportDependencies
  assignment: ImportAssignment
  context: XmlImportConfigurationContext
  collector: ConfigurationIndexCollector
  profiler?: ValidationProfiler
  topology?: CompiledMetadataResourceTopology
}): Promise<PreparedImportYaml> {
  const xmlInputs = await readAndParseAssignmentXml(
    params.assignment.xmlFiles,
    params.profiler,
  )
  return prepareImportYamlFromParsedInputs({ ...params, xmlInputs })
}

export async function readImportXmlDocuments(params: {
  readonly assignment: ImportAssignment
  readonly profiler?: ValidationProfiler
  readonly profilePass: "first" | "second"
}): Promise<ParsedImportXmlDocument[]> {
  return (await readAndParseAssignmentXml(
    params.assignment.xmlFiles,
    params.profiler,
    params.profilePass,
  )).map(
    ({ input, document }) => {
      if (document === undefined) throw new Error(`Не построено адресное XML-дерево: ${input.sourcePath}`)
      return { input, document }
    },
  )
}

interface ImportFormProofOptions {
  readonly localRoundTrip?: ImportLocalRoundTripOptions
  readonly formProofYaml?: ClientApplicationFormYAML
  readonly formProofDataPathContext?: FormDataPathContext
  readonly currentConfigurationFormYaml?: ClientApplicationFormYAML
  readonly savedBaseFormYaml?: ClientApplicationFormYAML
  readonly baseFormSource?: "saved" | "projected"
  readonly baseFormProofYaml?: ClientApplicationFormYAML
}

export async function prepareImportYamlFromDocuments(params: ImportFormProofOptions & {
  readonly dependencies?: PreparedImportDependencies
  readonly baseFormDependencies?: PreparedImportDependencies
  readonly assignment: ImportAssignment
  readonly context: XmlImportConfigurationContext
  readonly collector: ConfigurationIndexCollector
  readonly inputs: readonly ParsedImportXmlDocument[]
  readonly profiler?: ValidationProfiler
  readonly topology?: CompiledMetadataResourceTopology
}): Promise<PreparedImportYaml> {
  return prepareImportYamlFromParsedInputs({
    ...params,
    xmlInputs: params.inputs.map(({ input, document }) => ({
      input,
      document,
      roots: document.roots,
    })),
  })
}

function prepareImportYamlFromParsedInputs(params: ImportFormProofOptions & {
  readonly dependencies?: PreparedImportDependencies
  readonly baseFormDependencies?: PreparedImportDependencies
  readonly assignment: ImportAssignment
  readonly context: XmlImportConfigurationContext
  readonly collector: ConfigurationIndexCollector
  readonly xmlInputs: ParsedImportXmlInput[]
  readonly profiler?: ValidationProfiler
  readonly topology?: CompiledMetadataResourceTopology
}): PreparedImportYaml {
    const xmlInputs = params.xmlInputs
    const annotations = createXmlAnomalyAnnotations()
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
    const formProofContexts = params.localRoundTrip !== undefined && params.formProofDataPathContext !== undefined
      ? prepareClientApplicationFormProofContextsFromPrepared(params.localRoundTrip.context, params.formProofDataPathContext)
      : params.localRoundTrip === undefined
      || (params.formProofYaml === undefined && rule.itemType !== ClientApplicationFormRules.itemType)
      ? undefined
      : prepareClientApplicationFormProofContexts(
          params.localRoundTrip.context,
          params.formProofYaml === undefined
            ? undefined
            : {
                yaml: params.formProofYaml,
                ...(params.currentConfigurationFormYaml === undefined
                  ? {}
                  : { currentConfigurationFormYaml: params.currentConfigurationFormYaml }),
                ...(params.savedBaseFormYaml === undefined
                  ? {}
                  : { savedBaseFormYaml: params.savedBaseFormYaml }),
                rule: ClientApplicationFormRules,
              },
        )
    const formBodyProof = params.localRoundTrip === undefined || rule.itemType !== ClientApplicationFormRules.itemType
      ? undefined
      : createLocalXmlProof()
    const localRoundTripParams = params.localRoundTrip === undefined
      ? undefined
      : (({ finalizeRootYaml: _finalizeRootYaml, ...rest }) => ({
          ...rest,
          context: formProofContexts?.metadata ?? rest.context,
        }))(params.localRoundTrip)
    const finalizeRootYaml = params.localRoundTrip?.finalizeRootYaml
    const baseFormCandidate = importAssignmentBaseFormCandidate({
      assignment: params.assignment,
      topology: params.topology,
      inputs: xmlInputs,
      context: importContext,
      dependencies: params.dependencies,
      baseFormDependencies: params.baseFormDependencies,
      profiler: params.profiler,
      source: params.baseFormSource ?? "saved",
      proofYaml: params.baseFormProofYaml,
      ...(localRoundTripParams === undefined
        ? {}
        : {
            localRoundTrip: {
              ...localRoundTripParams,
              ...(formProofContexts?.form === undefined
                ? {}
                : { proofContext: formProofContexts.form }),
              prepareRootProof: ({ key }) => key === "source-0" ? formBodyProof : undefined,
            },
          }),
    })
    let localRoundTrip: ReturnType<typeof createImportLocalRoundTrip> | undefined
    localRoundTrip = localRoundTripParams === undefined ? undefined : createImportLocalRoundTrip({
      ...localRoundTripParams,
      isDocumentRoot: (candidate) => candidate === rule,
      profiler: params.profiler,
      annotations,
      ...(finalizeRootYaml === undefined
        ? {}
        : { finalizeRootYaml: (yaml: Record<string, unknown>, itemRule: MetadataItemRule) => {
            finalizeRootYaml(
              yaml,
              itemRule,
              annotations,
              baseFormCandidate?.yaml,
              baseFormCandidate,
            )
          } }),
      prepareRootOutput: ({ key, source, proof }: {
        readonly key: string
        readonly source: XmlElementNode
        readonly proof: ReturnType<typeof createLocalXmlProof>
      }) =>
        source.name !== "Form" && !(rule.itemType === ClientApplicationFormRules.itemType && source.name === "MetaDataObject")
          ? undefined
          : withBaseFormReceipt(
              prepareClientApplicationFormRootOutput({ key, source, context: localRoundTripParams.context }),
              key === "source-0" && baseFormCandidate?.localProofReceipt !== undefined
                ? retainBaseFormReceipt({
                    source,
                    proof,
                    prior: baseFormCandidate.localProofReceipt,
                    retain: receipt => localRoundTrip!.retainReceipt(receipt),
                  })
                : undefined,
            ),
      prepareRootContext: ({ key, source }: { readonly key: string; readonly source: XmlElementNode }) =>
        source.name !== "Form"
          ? undefined
          : key === "source-0" ? formProofContexts?.form : formProofContexts?.metadata,
      prepareRootProof: ({ key, source }: { readonly key: string; readonly source: XmlElementNode }) =>
        source.name === "Form" && key === "source-0" ? formBodyProof : undefined,
      ...(rule.itemType !== ClientApplicationFormRules.itemType
        ? {}
        : {
            prepareRootRawPathPrefix: ({ tags }: { readonly tags?: readonly string[] }) =>
              tags?.includes(FormRulesTags.Form) === true ? ["@Form"] : undefined,
          }),
    })
    const importProfile = params.profiler === undefined
      ? undefined
      : createDirectImportProfile({ propertyTypes: true })
    const result: DirectImportResult & Pick<PreparedImportYaml, "baseFormCandidate" | "dependentDeferred"> = measureYaml(params.profiler, () => {
      if (rule.itemType === ClientApplicationFormRules.itemType) {
        const metadataXMLNode = requireMetadataXmlNode(xmlInputs)
        const bodyInput = xmlInputs.find(({ input }) => input.role === "body")
        const formXMLNode = bodyInput?.document.roots.find(({ name }) => name === "Form")
        const formImportContext: XmlImportConfigurationContext = {
          ...importContext,
          fromXML: {
            ...importContext.fromXML,
            ...(bodyInput?.input.sourcePath === undefined
              ? {}
              : { currentXMLPath: bodyInput.input.sourcePath }),
          },
        }
        const imported = importClientApplicationFormFromXMLToYAML({
          dependencies: params.dependencies,
          context: formImportContext,
          formName: params.assignment.itemName,
          formXML: formXMLNode,
          metadataXML: metadataXMLNode,
          annotations,
          profile: importProfile,
          rule,
          roundTrip: localRoundTrip,
        })
        if (imported.yaml !== undefined && imported.yaml !== null && typeof imported.yaml === "object") {
          localRoundTrip?.release(imported.yaml)
        }
        return {
          ...imported,
          dependentDeferred: [],
          ...(baseFormCandidate === undefined ? {} : { baseFormCandidate }),
        }
      }

      const collector = createLocalIndexesCollector()
      const deferred = createDeferredValuePathCollector()
      const dependent = createImportedDependentPropertyCollector()
      const metadataNode = requireMetadataXmlNode(xmlInputs)
      const externalPropertyXml = mapExternalPropertyXmlInputs(rule, xmlInputs)
      const yaml = importMetadataItemFromXMLToYAML({
        context: importContext,
        rule,
        name: params.assignment.itemName,
        xml: metadataNode,
        traversal: {
          yamlPath: [],
          rulePath: [],
          collector,
          deferred,
          dependent,
          dependencies: params.dependencies,
          annotations,
          roundTrip: localRoundTrip,
          ...(metadataNode === undefined ? {} : { xmlNodes: [metadataNode] }),
          profile: importProfile,
        },
        propertyXML: externalPropertyXml.valuesByPropertyKey,
        propertyXMLNodes: externalPropertyXml.nodesByPropertyKey,
      })
      if (yaml === undefined) throw new Error("XML-import не сформировал YAML")
      if (yaml === null || typeof yaml !== "object") throw new Error("XML-import сформировал не объект YAML")
      localRoundTrip?.release(yaml)
      const dependentCandidates = dependent.finish()
      const partitioned = partitionImportedDependentItems({
        yaml,
        rule,
        candidates: dependentCandidates,
        owner: dependentOwner,
      })
      normalizeImportedDependentItems({
        yaml,
        rule,
        candidates: partitioned.immediate,
        owner: dependentOwner,
        preserveRawXML: false,
      })
      const localIndexes = collector.finish()
      const formDataPathIndex = createImportedFormDataPathIndex({ yaml, rule })
      if (formDataPathIndex !== undefined) localIndexes.metadata.formDataPathIndex = formDataPathIndex
      return {
        yaml,
        localIndexes,
        deferred: deferred.finish(),
        dependentDeferred: partitioned.deferred,
        generatedFiles,
        ...(baseFormCandidate === undefined ? {} : { baseFormCandidate }),
      }
    })
    if (importProfile !== undefined) recordDirectImportProfile(params.profiler, importProfile)
    params.profiler?.record("Подготовка импорта конфигурации", "Сбор локальных индексов", {
      items: result.localIndexes.metadata.events.length,
      timeMs: 0,
    })
    return {
      assignment: params.assignment,
      targetProjectPath: params.assignment.targetProjectPath,
      yaml: result.yaml,
      annotations,
      rule,
      ownerContext,
      localIndexes: result.localIndexes,
      deferred: bindDeferredObjectValues(result.yaml, result.deferred),
      dependentDeferred: result.dependentDeferred,
      dependentOwner,
      generatedFiles: [...generatedFiles, ...result.generatedFiles.filter((file) => !generatedFiles.includes(file))],
      ...(localRoundTrip === undefined ? {} : { localProofCompleted: true }),
      ...(result.baseFormCandidate === undefined ? {} : { baseFormCandidate: result.baseFormCandidate }),
    }
}

function importAssignmentBaseFormCandidate(params: {
  readonly assignment: ImportAssignment
  readonly topology?: CompiledMetadataResourceTopology
  readonly inputs: readonly ParsedImportXmlInput[]
  readonly context: XmlImportConfigurationContext
  readonly dependencies?: PreparedImportDependencies
  readonly baseFormDependencies?: PreparedImportDependencies
  readonly profiler?: ValidationProfiler
  readonly source: "saved" | "projected"
  readonly proofYaml?: ClientApplicationFormYAML
  readonly localRoundTrip?: Omit<ImportLocalRoundTripOptions, "finalizeRootYaml"> & {
    readonly finalizeRootYaml?: ImportLocalRoundTripOptions["finalizeRootYaml"]
    readonly proofContext?: ConfigurationContextWithExportToXML
  }
}): PreparedBaseFormCandidate | undefined {
  const bodyInput = params.inputs.find(({ input }) => input.role === "body")
  const formNode = bodyInput?.document.roots.find(({ name }) => name === "Form")
  const baseFormNode = formNode?.content.find(
    (node): node is XmlElementNode => node.type === "element" && node.name === "BaseForm",
  )
  if (baseFormNode === undefined || isEmptyXmlElement(baseFormNode)) return undefined
  const companion = resolveBaseFormCompanion(params.assignment, params.topology)
  if (companion === undefined) return undefined
  const annotations = createXmlAnomalyAnnotations()
  // Локальное сравнение уже находит остаток XML; второй аудит чтений не нужен.
  const audit = params.localRoundTrip === undefined ? createXmlImportAuditSession([baseFormNode]) : undefined
  const prepareProof = params.proofYaml === undefined
    ? undefined : createBaseFormProofPreparation(params.proofYaml, annotations)
  const localRoundTrip = params.localRoundTrip === undefined ? undefined : createImportLocalRoundTrip({
    execution: params.localRoundTrip.execution,
    context: params.localRoundTrip.context,
    decisions: [],
    ...(params.localRoundTrip.selectBaseFormDecisions === undefined
      ? {}
      : { selectDecisions: params.localRoundTrip.selectBaseFormDecisions }),
    annotations,
    profiler: params.profiler,
    isDocumentRoot: (candidate) => candidate === companion.rule,
    ...(prepareProof === undefined
      ? {}
      : {
          prepareYamlForProof: (
            yaml: Record<string, unknown>,
            _rule: MetadataItemRule,
            yamlPath: readonly (string | number)[],
          ) => {
            prepareProof(yaml, yamlPath)
          },
        }),
    prepareRootRawPathPrefix: ({ source }) => source === baseFormNode ? [] : undefined,
    accumulateRawAtDocumentRoot: true,
    ...(params.localRoundTrip.prepareRootProof === undefined
      ? {}
      : { prepareRootProof: params.localRoundTrip.prepareRootProof }),
    ...(params.localRoundTrip.proofContext === undefined
      ? {}
      : { prepareRootContext: () => params.localRoundTrip?.proofContext }),
  })
  const baseForm = importBaseFormYaml({
    context: params.context,
    baseFormXML: baseFormNode,
    formName: params.assignment.itemName,
    rule: companion.rule,
    annotations,
    audit,
    dependencies: params.baseFormDependencies ?? params.dependencies,
    roundTrip: localRoundTrip,
  })
  const localProofReceipt = baseForm.yaml !== undefined && localRoundTrip !== undefined
    ? localRoundTrip.takeResult(baseForm.yaml as object).roots.get("source-0")
    : undefined
  return {
    source: params.source,
    baseProjectPath: params.assignment.targetProjectPath,
    targetProjectPath: companion.targetProjectPath,
    owner: {
      dir: params.assignment.targetProjectPath.split("/", 1)[0] ?? "",
      name: params.assignment.owner?.name ?? params.assignment.itemName,
    },
    yaml: baseForm.yaml,
    annotations: baseForm.annotations,
    rule: companion.rule,
    localIndexes: baseForm.localIndexes,
    deferred: bindDeferredObjectValues(baseForm.yaml, baseForm.deferred),
    configurationFragment: baseForm.configurationIndexCollector.fragment(companion.targetProjectPath),
    ...(localProofReceipt === undefined ? {} : { localProofReceipt }),
  }
}

function withBaseFormReceipt(
  preparation: import("@nkdk/runtime/rule-kit").XMLItemOutputPreparation | undefined,
  receipt: object | undefined,
): import("@nkdk/runtime/rule-kit").XMLItemOutputPreparation | undefined {
  if (receipt === undefined) return preparation
  return {
    ...(preparation ?? {}),
    attributes: preparation?.attributes ?? ((own) => own),
    initialize(body) {
      preparation?.initialize?.(body)
      Object.assign(body, { BaseForm: receipt })
    },
  }
}

function retainBaseFormReceipt(params: {
  readonly source: XmlElementNode
  readonly proof: ReturnType<typeof createLocalXmlProof>
  readonly prior: import("@nkdk/runtime/rule-kit").LocalXmlChild
  readonly retain: (receipt: import("@nkdk/runtime/rule-kit").LocalXmlChild) => object
}): object {
  const baseForm = params.source.content.find(
    (entry): entry is XmlElementNode => entry.type === "element" && entry.name === "BaseForm",
  )
  if (baseForm === undefined) throw new Error("Для проверенной основы не найден XML BaseForm")
  if (
    params.prior.sourceId !== baseForm.id
    || params.prior.name !== baseForm.name
    || params.prior.occurrence !== baseForm.occurrence
  ) {
    throw new Error("Квитанция проверенной основы не соответствует XML BaseForm")
  }
  const receipt = params.proof.completed(baseForm) ?? params.proof.accept(baseForm)
  return params.retain(receipt)
}

export function resolveBaseFormCompanion(
  assignment: ImportAssignment,
  topology?: CompiledMetadataResourceTopology,
): {
  targetProjectPath: string
  rule: MetadataItemRule
} | undefined {
  const node = (topology ?? compileRegisteredMetadataResourceTopology()).assignments.find(
    ({ id }) => id === assignment.topologyAddress.nodeId
  )
  if (node === undefined) throw new Error(`Не найден узел топологии формы ${assignment.topologyAddress.nodeId}`)
  const companions = node.yamlCompanions.filter(({ projectRole }) => projectRole === "form")
  if (companions.length === 0) return undefined
  if (companions.length > 1) throw new Error(`У задания формы несколько YAML-спутников: ${assignment.targetProjectPath}`)
  const companion = companions[0]!
  return {
    targetProjectPath: expandMetadataPathPattern(companion.projectPattern, assignment.topologyAddress.values),
    rule: companion.itemRule,
  }
}

export function resolveAssignmentRule(
  assignment: ImportAssignment,
  componentKind: string,
  topology?: CompiledMetadataResourceTopology,
): MetadataItemRule {
  if (assignment.role === "configuration") return getMetadataComponentDescriptor(componentKind).rootRule
  const node =
    (topology ?? compileRegisteredMetadataResourceTopology()).assignments.find(
      ({ id }) => id === assignment.topologyAddress.nodeId
    )
  if (node === undefined) {
    throw new Error(
      `Не найден узел topology XML-import: ${assignment.topologyAddress.nodeId}`
    )
  }
  return node.itemRule
}

export function createAssignmentImportEnvironment(params: {
  readonly assignment: ImportAssignment
  readonly rule: MetadataItemRule
  readonly context: XmlImportConfigurationContext
  readonly collector: ConfigurationIndexCollector
  readonly generatedFiles: ExternalFileEntry[]
}): {
  readonly ownerContext: readonly MetadataItemOwnerContextEntry[]
  readonly importContext: XmlImportConfigurationContext
  readonly dependentOwner: { readonly dir: string; readonly name: string }
} {
  const ownerContext = buildOwnerContext(params.assignment, params.rule)
  const collectedContext = withConfigurationIndexCollector(
    params.context,
    params.collector,
    params.assignment.logicalAddress,
  )
  const importContext = withExportMetadataTargetOwners({
    ...collectedContext,
    exportToYAML: {
      ...(collectedContext.exportToYAML ?? { toTyped: false }),
      externalFilesCollector: params.generatedFiles,
      parent: { name: params.assignment.itemName },
    },
  }, ownerContext) as XmlImportConfigurationContext
  return {
    ownerContext,
    importContext,
    dependentOwner: {
      dir: params.assignment.targetProjectPath.split("/", 1)[0] ?? "",
      name: params.assignment.owner?.name ?? params.assignment.itemName,
    },
  }
}

export function createResolvedAssignmentImportEnvironment(params: {
  readonly assignment: ImportAssignment
  readonly context: XmlImportConfigurationContext
  readonly collector: ConfigurationIndexCollector
  readonly topology?: CompiledMetadataResourceTopology
}): ReturnType<typeof createAssignmentImportEnvironment> & {
  readonly rule: MetadataItemRule
  readonly generatedFiles: ExternalFileEntry[]
} {
  const generatedFiles: ExternalFileEntry[] = []
  const rule = resolveAssignmentRule(
    params.assignment,
    params.context.fromXML.componentKind,
    params.topology,
  )
  return {
    rule,
    generatedFiles,
    ...createAssignmentImportEnvironment({
      assignment: params.assignment,
      rule,
      context: params.context,
      collector: params.collector,
      generatedFiles,
    }),
  }
}

export function buildOwnerContext(
  assignment: ImportAssignment,
  rule: MetadataItemRule
): readonly MetadataItemOwnerContextEntry[] {
  const owner = assignment.owner
  if (owner !== undefined) {
    const ownerRule = findRegisteredImportRule(owner.itemType)
    const targetOwner =
      ownerRule === undefined ? undefined : metadataTargetOwnerFromRule({ itemRule: ownerRule, name: owner.name })
    return appendMetadataItemOwner([], owner.itemType as never, owner.name, "", targetOwner)
  }
  const targetOwner = metadataTargetOwnerFromRule({ itemRule: rule, name: assignment.itemName })
  return appendMetadataItemOwner([], rule.itemType, assignment.itemName, "", targetOwner)
}

async function readAndParseAssignmentXml(
  xmlFiles: readonly ImportXmlInput[],
  profiler: ValidationProfiler | undefined,
  profilePass?: "first" | "second",
): Promise<ParsedImportXmlInput[]> {
  const passLabel = profilePass === "first"
    ? " первого прохода"
    : profilePass === "second"
      ? " второго прохода"
      : ""
  const result: ParsedImportXmlInput[] = []
  for (const input of xmlFiles) {
    try {
      const content =
        (await profiler?.measureAsync("Подготовка импорта конфигурации", `Чтение XML${passLabel}`, { items: 1 }, () =>
          fs.promises.readFile(input.sourcePath, "utf-8")
        )) ?? (await fs.promises.readFile(input.sourcePath, "utf-8"))
      result.push({
        input,
        ...(() => {
          return profiler?.measure(
            "Подготовка импорта конфигурации",
            `Парсинг XML${passLabel}`,
            { items: 1, bytes: Buffer.byteLength(content) },
            () => parseAssignmentXml(content),
          ) ?? parseAssignmentXml(content)
        })(),
      })
    } catch (caught) {
      throw new ImportXmlInputError(input.sourcePath, caught)
    }
  }
  return result
}

function parseAssignmentXml(content: string): Omit<ParsedImportXmlInput, "input"> {
  const document = parseXmlDocumentWithSaxes(content)
  return { document, roots: document.roots }
}

export function requireMetadataXmlNode(inputs: readonly ParsedImportXmlInput[]): XmlElementNode {
  const metadata = inputs.find(({ input }) => input.role === "metadata")
  if (metadata === undefined) throw new Error("В задании XML-import отсутствует metadata XML")
  const node = metadata.document.roots.find(({ name }) => name === "MetaDataObject")
  if (node === undefined) throw new Error("В metadata XML отсутствует MetaDataObject")
  return node
}

function measureYaml<T>(profiler: ValidationProfiler | undefined, fn: () => T): T {
  if (profiler === undefined) return fn()
  return profiler.measure("Подготовка импорта конфигурации", "Преобразование XML в YAML", { items: 1 }, fn)
}

function recordDirectImportProfile(profiler: ValidationProfiler | undefined, profile: DirectImportProfile): void {
  if (profiler === undefined) return
  const step = "Подготовка импорта конфигурации"
  profiler.record(step, "XML в YAML: подготовка плана импорта", {
    items: profile.propertyCount,
    timeMs: profile.planningMs,
  })
  profiler.record(step, "XML в YAML: обход XML", { items: profile.propertyCount, timeMs: profile.xmlTraversalMs })
  profiler.record(step, "XML в YAML: сбор данных индекса конфигурации", {
    items: profile.propertyCount,
    timeMs: profile.configurationIndexMs,
  })
  profiler.record(step, "XML в YAML: прямые преобразователи", {
    items: profile.directCount,
    timeMs: profile.directInclusiveMs,
  })
  profiler.record(step, "XML в YAML: fromXML атомарных свойств", {
    items: profile.legacyCount,
    timeMs: profile.legacyFromXmlMs,
  })
  profiler.record(step, "XML в YAML: toYAML атомарных свойств", {
    items: profile.legacyCount,
    timeMs: profile.yamlExportMs,
  })
  profiler.record(step, "XML в YAML: значения по умолчанию", {
    items: profile.propertyCount,
    timeMs: profile.defaultMs,
  })
  profiler.record(step, "XML в YAML: запись значений в YAML", {
    items: profile.exportedCount,
    timeMs: profile.outputMs,
  })
  profiler.record(step, "XML в YAML: сбор локальных фактов", {
    items: profile.exportedCount,
    timeMs: profile.collectorMs,
  })
  recordProfileBuckets(profiler, "XML в YAML: прямой тип", profile.directByType)
  recordProfileBuckets(profiler, "XML в YAML: атомарный тип", profile.legacyByType)
  recordProfileBuckets(profiler, "XML в YAML fused atomic", profile.fusedAtomicByType)
  for (const [propertyType, value] of Object.entries(profile.propertyTypeProfiles)) {
    profiler.record("XML в YAML PropertyRule inclusive", propertyType, {
      items: value.propertyCount,
      timeMs: value.inclusiveMs,
    })
    profiler.record("XML в YAML PropertyRule exclusive", propertyType, {
      items: value.propertyCount,
      timeMs: value.exclusiveMs,
    })
  }
}

function recordProfileBuckets(
  profiler: ValidationProfiler,
  prefix: string,
  buckets: ReadonlyMap<string, { count: number; timeMs: number }>
): void {
  for (const [type, bucket] of buckets) {
    profiler.record("Подготовка импорта конфигурации", `${prefix} ${type}`, {
      items: bucket.count,
      timeMs: bucket.timeMs,
    })
  }
}

export function mapExternalPropertyXmlInputs(
  rule: MetadataItemRule,
  inputs: readonly ParsedImportXmlInput[],
): {
  readonly valuesByPropertyKey: ReadonlyMap<string, unknown>
  readonly nodesByPropertyKey: ReadonlyMap<string, readonly XmlElementNode[]>
} {
  const valuesByPropertyKey = new Map<string, unknown>()
  const nodesByPropertyKey = new Map<string, readonly XmlElementNode[]>()
  for (const [key, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    if (propertyRule.filePath === undefined) continue
    const normalizedFilePath = propertyRule.filePath.replace(/\\/g, "/")
    const input = inputs.find(({ input }) => normalizedPath(input.sourcePath).endsWith(`/${normalizedFilePath}`))
    if (input === undefined) continue
    const roots = input.document.roots
    valuesByPropertyKey.set(key, roots.length === 1 ? roots[0] : roots)
    nodesByPropertyKey.set(key, roots)
  }
  return { valuesByPropertyKey, nodesByPropertyKey }
}

function normalizedPath(path: string): string {
  return path.replace(/\\/g, "/")
}

function findRegisteredImportRule(itemType: string): MetadataItemRule | undefined {
  if (registeredImportRulesByItemType.has(itemType)) return registeredImportRulesByItemType.get(itemType)
  registeredImportRuleLookupCountValueForTests += 1
  const rule = findRegisteredProjectRule(itemType)
  registeredImportRulesByItemType.set(itemType, rule)
  return rule
}

export class ImportXmlInputError extends Error {
  readonly sourcePath: string

  constructor(sourcePath: string, cause: unknown) {
    super(`Не удалось прочитать или разобрать XML-файл ${sourcePath}: ${errorMessage(cause)}`, { cause })
    this.name = "ImportXmlInputError"
    this.sourcePath = sourcePath
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
