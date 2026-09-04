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
import { recordClientApplicationFormNamespaces } from "./namespaces"

export function importClientApplicationFormFromXMLToYAML(params: {
  dependencies?: PreparedImportDependencies
  context: Parameters<typeof importPropertiesFromXMLToYAML>[0]["context"]
  formName: string
  formXML?: ClientApplicationFormXML
  metadataXML: FormMetadataXML
  formXMLNode?: XmlElementNode
  metadataXMLNode?: XmlElementNode
  audit?: XmlImportAuditSession
  annotations?: XmlAnomalyAnnotationTable
  profile?: DirectImportProfile
  rule?: MetadataItemRule
  mode?: DirectImportMode
  facts?: DirectImportFactsSink
  roundTrip?: DirectImportRoundTripExecution
  beforeFinish?: (yaml: Record<string, unknown>) => void
}): DirectImportResult {
  const rule = params.rule ?? ClientApplicationFormRules
  if (params.formXML === undefined && params.metadataXML.Form.Properties.FormType !== "Ordinary") {
    throw new Error(`Не найден Form.xml для управляемой формы ${params.formName}`)
  }
  const localIndexesCollector = createLocalIndexesCollector()
  const deferred = createDeferredValuePathCollector()
  const augmenterSource = { ...params.metadataXML.Form }
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
    audit: params.audit,
    annotations: params.annotations,
    profile: params.profile,
    mode: params.mode,
    facts: params.facts,
    dependencies: params.dependencies,
    roundTrip: params.roundTrip,
    beforeFinish: (yaml) => {
      applyMetadataItemXmlImportAugmenter({
        context,
        rule,
        source: augmenterSource,
        yaml,
      })
      params.beforeFinish?.(yaml)
    },
    createSources: (context) => createClientApplicationFormImportSources({
      context,
      formXML: params.formXMLNode ?? params.formXML,
      metadataXML: params.metadataXMLNode ?? params.metadataXML,
    }),
  })
  const yaml = imported.yaml
  if (params.formXML !== undefined) {
    recordClientApplicationFormNamespaces(params.context, params.formXMLNode ?? params.formXML)
  }

  const localIndexes = localIndexesCollector.finish()
  if (params.mode !== "facts") localIndexes.metadata.formDataPathIndex = createFormDataPathIndexFromYAML(yaml)
  return {
    yaml,
    localIndexes,
    deferred: deferred?.finish() ?? [],
    generatedFiles: imported.generatedFiles,
  }
}

export function importClientApplicationFormBodyFromXML(params: {
  dependencies?: PreparedImportDependencies
  context: Parameters<typeof importPropertiesFromXMLToYAML>[0]["context"]
  formName: string
  formXML: ClientApplicationFormXML | XmlElementNode
  collector: LocalIndexesCollector
  deferred?: DeferredValuePathCollector
  audit?: XmlImportAuditSession
  annotations?: XmlAnomalyAnnotationTable
  profile?: DirectImportProfile
  rule?: MetadataItemRule
  mode?: DirectImportMode
  facts?: DirectImportFactsSink
  roundTrip?: DirectImportRoundTripExecution
  beforeFinish?: (yaml: Record<string, unknown>) => void
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

function importClientApplicationFormSources(params: {
  dependencies?: PreparedImportDependencies
  context: Parameters<typeof importPropertiesFromXMLToYAML>[0]["context"]
  formName: string
  rule: MetadataItemRule
  collector: LocalIndexesCollector
  deferred?: DeferredValuePathCollector
  audit?: XmlImportAuditSession
  annotations?: XmlAnomalyAnnotationTable
  profile?: DirectImportProfile
  mode?: DirectImportMode
  facts?: DirectImportFactsSink
  roundTrip?: DirectImportRoundTripExecution
  beforeFinish?: (yaml: Record<string, unknown>) => void
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
      audit: params.audit,
      annotations: params.annotations,
      profile: params.profile,
      mode: params.mode,
      facts: params.facts,
      dependencies: params.dependencies,
      roundTrip: params.roundTrip,
      beforeFinish: params.beforeFinish,
    }),
    generatedFiles,
    context,
  }
}
