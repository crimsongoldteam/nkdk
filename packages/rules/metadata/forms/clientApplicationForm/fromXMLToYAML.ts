import type {
  ExternalFileEntry,
  XmlAnomalyAnnotationTable,
  XmlElementNode,
  XmlImportAuditSession,
} from "@nkdk/runtime"
import {
  applyMetadataItemXmlImportAugmenter,
  resolveMetadataItemXMLDefaultVariant,
  withResolvedXMLImportObjectVariant,
} from "../../ruleRuntime/metadataItem/augmenterRegistry"
import { importPropertiesFromXMLToYAML } from "../../ruleRuntime/property/fromXMLToYAML"
import {
  createDeferredValuePathCollector,
  type DeferredValuePathCollector,
  type DirectImportProfile,
  type DirectImportResult,
  type DirectImportFactsSink,
  type DirectImportMode,
  type DirectImportRoundTripExecution,
  type PreparedImportDependencies,
  type DirectImportXMLSource,
  type LocalIndexesCollector,
} from "@nkdk/runtime/rule-kit"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, FormMetadataXML } from "./types"
import { createClientApplicationFormImportSources } from "./xmlImportSources"
import type { MetadataItemRule } from "../../ruleRuntime"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"
import { formMetadataSource, formTypeFromMetadataXML } from "./metadataXML"

interface FormImportExecutionOptions {
  dependencies?: PreparedImportDependencies
  context: Parameters<typeof importPropertiesFromXMLToYAML>[0]["context"]
  formName: string
  audit?: XmlImportAuditSession
  annotations?: XmlAnomalyAnnotationTable
  profile?: DirectImportProfile
  rule?: MetadataItemRule
  mode?: DirectImportMode
  produceResult?: boolean
  facts?: DirectImportFactsSink
  roundTrip?: DirectImportRoundTripExecution
  beforeFinish?: (yaml: Record<string, unknown>) => void
}

export function importClientApplicationFormFromXMLToYAML(params: FormImportExecutionOptions & {
  formXML?: ClientApplicationFormXML | XmlElementNode
  metadataXML: FormMetadataXML | XmlElementNode
  formXMLNode?: XmlElementNode
  metadataXMLNode?: XmlElementNode
}): DirectImportResult {
  const rule = params.rule ?? ClientApplicationFormRules
  const formXML = params.formXMLNode ?? params.formXML
  const metadataXML = params.metadataXMLNode ?? params.metadataXML
  if (formXML === undefined && formTypeFromMetadataXML(metadataXML) !== "Ordinary") {
    throw new Error(`Не найден Form.xml для управляемой формы ${params.formName}`)
  }
  const localIndexesCollector = createLocalIndexesCollector()
  const deferred = createDeferredValuePathCollector()
  const augmenterSource = formMetadataSource(metadataXML) ?? {}
  const context = withResolvedXMLImportObjectVariant(
    params.context,
    resolveMetadataItemXMLDefaultVariant({
      context: params.context,
      rule,
      source: augmenterSource,
    }),
  )
  const imported = importClientApplicationFormSources({
    context,
    rule,
    formName: params.formName,
    collector: localIndexesCollector,
    deferred,
    ...formImportExecutionOptions(params),
    beforeFinish: (yaml) => {
      applyMetadataItemXmlImportAugmenter({
        context,
        rule,
        source: augmenterSource,
        yaml,
      })
      if (context.fromXML.currentXMLDefaultVariant === "adopted" && yaml.РасширенноеПредставление === "") {
        movePropertyLast(yaml, "РасширенноеПредставление")
      }
      params.beforeFinish?.(yaml)
    },
    createSources: (context) => createClientApplicationFormImportSources({
      context,
      formXML,
      metadataXML,
    }),
  })
  const yaml = imported.yaml

  const localIndexes = localIndexesCollector.finish()
  if (params.mode !== "facts") localIndexes.metadata.formDataPathIndex = createFormDataPathIndexFromYAML(yaml)
  return {
    yaml,
    localIndexes,
    deferred: deferred?.finish() ?? [],
    generatedFiles: imported.generatedFiles,
  }
}

function movePropertyLast(value: Record<string, unknown>, key: string): void {
  if (Object.keys(value).at(-1) === key) return
  const descriptor = Object.getOwnPropertyDescriptor(value, key)
  if (descriptor === undefined) return
  if (!Reflect.deleteProperty(value, key)) throw new Error(`Нельзя переместить свойство ${key}`)
  Object.defineProperty(value, key, descriptor)
}

export function importClientApplicationFormBodyFromXML(params: FormImportExecutionOptions & {
  formXML: ClientApplicationFormXML | XmlElementNode
  collector: LocalIndexesCollector
  deferred?: DeferredValuePathCollector
}): { yaml: Record<string, unknown> | undefined; generatedFiles: ExternalFileEntry[] } {
  const { context: _context, ...result } = importClientApplicationFormSources({
    ...params,
    rule: params.rule ?? ClientApplicationFormRules,
    createSources: (context) => [createClientApplicationFormImportSources({
      context,
      formXML: params.formXML,
      metadataXML: {},
    })[0]!],
  })
  return result
}

function importClientApplicationFormSources(params: Omit<FormImportExecutionOptions, "rule"> & {
  rule: MetadataItemRule
  collector: LocalIndexesCollector
  deferred?: DeferredValuePathCollector
  createSources(context: Parameters<typeof importPropertiesFromXMLToYAML>[0]["context"]): DirectImportXMLSource[]
}): {
  yaml: Record<string, unknown> | undefined
  generatedFiles: ExternalFileEntry[]
  context: Parameters<typeof importPropertiesFromXMLToYAML>[0]["context"]
} {
  const generatedFiles: ExternalFileEntry[] = []
  const context = params.context.exportToYAML === undefined
    ? params.context
    : {
        ...params.context,
        exportToYAML: {
          ...params.context.exportToYAML,
          externalFilesCollector: generatedFiles,
          parent: { name: params.formName },
        },
      }
  return {
    yaml: importPropertiesFromXMLToYAML({
      context,
      rule: params.rule,
      sources: params.createSources(context),
      itemName: params.formName,
      yamlPath: [],
      rulePath: [],
      collector: params.collector,
      deferred: params.deferred,
      ...formImportExecutionOptions(params),
    }),
    generatedFiles,
    context,
  }
}

function formImportExecutionOptions(params: FormImportExecutionOptions) {
  return {
    audit: params.audit,
    annotations: params.annotations,
    profile: params.profile,
    mode: params.mode,
    produceResult: params.produceResult,
    facts: params.facts,
    dependencies: params.dependencies,
    roundTrip: params.roundTrip,
    beforeFinish: params.beforeFinish,
  }
}
