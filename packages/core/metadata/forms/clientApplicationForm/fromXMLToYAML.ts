import { childUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexFormElementRootLogicalAddress,
  withConfigurationIndexXmlNodeLogicalAddress,
} from "../../configurationIndex/collector/context"
import type { ExternalFileEntry } from "../../context/types"
import { importPropertiesFromXMLToYAML } from "../../orchestration/property/fromXMLToYAML"
import type { DirectImportResult } from "../../orchestration/property/importYamlTypes"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, FormMetadataXML } from "./types"
import { FormRulesTags } from "./types"

export function importClientApplicationFormFromXMLToYAML(params: {
  context: Parameters<typeof importPropertiesFromXMLToYAML>[0]["context"]
  formName: string
  formXML?: ClientApplicationFormXML
  metadataXML: FormMetadataXML
}): DirectImportResult {
  if (params.formXML === undefined && params.metadataXML.Form.Properties.FormType !== "Ordinary") {
    throw new Error(`Не найден Form.xml для управляемой формы ${params.formName}`)
  }

  const collector = createLocalIndexesCollector()
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
  const collection = getConfigurationIndexCollectionContext(context)
  const formBodyContext =
    collection === undefined
      ? context
      : withConfigurationIndexXmlNodeLogicalAddress(
          withConfigurationIndexFormElementRootLogicalAddress(context, collection.logicalAddress),
          childUid(collection.logicalAddress, "ЧастьФормы", "Содержимое")
        )
  const formYaml = importPropertiesFromXMLToYAML({
    context: formBodyContext,
    rule: ClientApplicationFormRules,
    xml: (params.formXML ?? {}) as Record<string, unknown>,
    itemName: params.formName,
    yamlPath: [],
    rulePath: [],
    collector,
    tags: [FormRulesTags.Form],
  })
  const metadataYaml = importPropertiesFromXMLToYAML({
    context,
    rule: ClientApplicationFormRules,
    xml: params.metadataXML as unknown as Record<string, unknown>,
    itemName: params.formName,
    yamlPath: [],
    rulePath: [],
    collector,
    tags: [FormRulesTags.Metadata],
  })

  return {
    yaml: { ...formYaml, ...metadataYaml },
    localIndexes: collector.finish(),
    generatedFiles,
  }
}
