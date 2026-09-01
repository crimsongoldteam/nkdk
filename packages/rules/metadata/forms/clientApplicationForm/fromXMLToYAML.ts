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
  type DirectImportXMLSource,
  type LocalIndexesCollector,
} from "@nkdk/runtime/rule-kit"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, FormMetadataXML } from "./types"
import { createClientApplicationFormImportSources } from "./xmlImportSources"
import type { MetadataItemRule } from "../../ruleRuntime"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"

export function importClientApplicationFormFromXMLToYAML(params: {
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
}): DirectImportResult {
  const rule = params.rule ?? ClientApplicationFormRules
  if (params.formXML === undefined && params.metadataXML.Form.Properties.FormType !== "Ordinary") {
    throw new Error(`Не найден Form.xml для управляемой формы ${params.formName}`)
  }

  const localIndexesCollector = createLocalIndexesCollector()
  const deferred = params.mode === "facts" ? undefined : createDeferredValuePathCollector()
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
    createSources: (context) => createClientApplicationFormImportSources({
      context,
      formXML: params.formXMLNode ?? params.formXML,
      metadataXML: params.metadataXMLNode ?? params.metadataXML,
    }),
  })
  const yaml = imported.yaml
  if (yaml !== undefined) {
    applyMetadataItemXmlImportAugmenter({
      context: imported.context,
      rule,
      source: augmenterSource,
      yaml,
    })
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
  context: Parameters<typeof importPropertiesFromXMLToYAML>[0]["context"]
  formName: string
  formXML: ClientApplicationFormXML
  collector: LocalIndexesCollector
  deferred?: DeferredValuePathCollector
  audit?: XmlImportAuditSession
  annotations?: XmlAnomalyAnnotationTable
  profile?: DirectImportProfile
  rule?: MetadataItemRule
  mode?: DirectImportMode
  facts?: DirectImportFactsSink
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
    }),
    generatedFiles,
    context,
  }
}
