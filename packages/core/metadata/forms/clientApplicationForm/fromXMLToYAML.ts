import type { ExternalFileEntry } from "../../context/types"
import { importPropertiesFromXMLToYAML } from "../../orchestration/property/fromXMLToYAML"
import type { DirectImportProfile, DirectImportResult } from "../../orchestration/property/importYamlTypes"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { createFormDataPathIndexCollector } from "../../validation/dataPath/formYamlIndex"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, FormMetadataXML } from "./types"
import { createClientApplicationFormImportSources } from "./xmlImportSources"

export function importClientApplicationFormFromXMLToYAML(params: {
  context: Parameters<typeof importPropertiesFromXMLToYAML>[0]["context"]
  formName: string
  formXML?: ClientApplicationFormXML
  metadataXML: FormMetadataXML
  profile?: DirectImportProfile
}): DirectImportResult {
  if (params.formXML === undefined && params.metadataXML.Form.Properties.FormType !== "Ordinary") {
    throw new Error(`Не найден Form.xml для управляемой формы ${params.formName}`)
  }

  const localIndexesCollector = createLocalIndexesCollector()
  const formDataPathIndexCollector = createFormDataPathIndexCollector({
    filePath: `Формы/${params.formName}/Форма.yaml`,
  })
  const collector = {
    acceptProperty(fact: Parameters<typeof localIndexesCollector.acceptProperty>[0]) {
      localIndexesCollector.acceptProperty(fact)
      formDataPathIndexCollector.acceptProperty(fact)
    },
    completeValue(fact: Parameters<typeof localIndexesCollector.completeValue>[0]) {
      localIndexesCollector.completeValue(fact)
      formDataPathIndexCollector.completeValue(fact)
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
    rule: ClientApplicationFormRules,
    sources: createClientApplicationFormImportSources({
      context,
      formXML: params.formXML,
      metadataXML: params.metadataXML,
    }),
    itemName: params.formName,
    yamlPath: [],
    rulePath: [],
    collector,
    profile: params.profile,
  })

  const localIndexes = localIndexesCollector.finish()
  const formDataPathIndex = formDataPathIndexCollector.finish()
  localIndexes.metadata.formDataPathIndex = formDataPathIndex
  return {
    yaml,
    localIndexes,
    generatedFiles,
  }
}
