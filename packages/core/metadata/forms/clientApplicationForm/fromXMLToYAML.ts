import type { ExternalFileEntry } from "../../context/types"
import { applyMetadataItemXmlImportAugmenter } from "../../importFromXml/metadataItemAugmenter"
import { importPropertiesFromXMLToYAML } from "../../orchestration/property/fromXMLToYAML"
import {
  createDeferredValuePathCollector,
  type DirectImportProfile,
  type DirectImportResult,
} from "../../orchestration/property/importYamlTypes"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { createFormDataPathMetadataCollector } from "./formDataPathMetadata"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, FormMetadataXML } from "./types"
import { createClientApplicationFormImportSources } from "./xmlImportSources"
import type { MetadataItemRule } from "../../orchestration"

export function importClientApplicationFormFromXMLToYAML(params: {
  context: Parameters<typeof importPropertiesFromXMLToYAML>[0]["context"]
  formName: string
  formXML?: ClientApplicationFormXML
  metadataXML: FormMetadataXML
  profile?: DirectImportProfile
  rule?: MetadataItemRule
}): DirectImportResult {
  const rule = params.rule ?? ClientApplicationFormRules
  if (params.formXML === undefined && params.metadataXML.Form.Properties.FormType !== "Ordinary") {
    throw new Error(`Не найден Form.xml для управляемой формы ${params.formName}`)
  }

  const localIndexesCollector = createLocalIndexesCollector()
  const deferred = createDeferredValuePathCollector()
  const formDataPathMetadataCollector = createFormDataPathMetadataCollector({
    filePath: `Формы/${params.formName}/Форма.yaml`,
  })
  const collector = {
    acceptItem(fact: Parameters<typeof localIndexesCollector.acceptItem>[0]) {
      localIndexesCollector.acceptItem(fact)
      formDataPathMetadataCollector.acceptItem(fact)
    },
    acceptProperty(fact: Parameters<typeof localIndexesCollector.acceptProperty>[0]) {
      localIndexesCollector.acceptProperty(fact)
      formDataPathMetadataCollector.acceptProperty(fact)
    },
    completeValue(fact: Parameters<typeof localIndexesCollector.completeValue>[0]) {
      localIndexesCollector.completeValue(fact)
      formDataPathMetadataCollector.completeValue(fact)
    },
    finish: () => localIndexesCollector.finish(),
  }
  const generatedFiles: ExternalFileEntry[] = []
  const context =
    params.context.exportToYAML === undefined
      ? params.context
      : {
          ...params.context,
          exportToYAML: {
            ...params.context.exportToYAML,
            externalFilesCollector: generatedFiles,
            parent: { name: params.formName },
          },
        }
  const yaml = importPropertiesFromXMLToYAML({
    context,
    rule,
    sources: createClientApplicationFormImportSources({
      context,
      formXML: params.formXML,
      metadataXML: params.metadataXML,
    }),
    itemName: params.formName,
    yamlPath: [],
    rulePath: [],
    collector,
    deferred,
    profile: params.profile,
  })
  if (yaml !== undefined) {
    applyMetadataItemXmlImportAugmenter({
      context,
      rule,
      source: { ...params.metadataXML.Form },
      yaml,
    })
  }

  const localIndexes = localIndexesCollector.finish()
  const formDataPathIndex = formDataPathMetadataCollector.finish()
  localIndexes.metadata.formDataPathIndex = formDataPathIndex
  return {
    yaml,
    localIndexes,
    deferred: deferred.finish(),
    generatedFiles,
  }
}
