import fs from "fs"
import { dirname, join } from "path"
import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"
import type { ExternalMetadataContextItem } from "@nkdk/runtime/rule-kit"
import type { ClientApplicationFormXML, ClientApplicationFormYAML, FormMetadataXML } from "./types"
import { xmlExport } from "@nkdk/runtime"
import type { XmlWriteManifest } from "../../ruleRuntime/xmlWriteManifest"
import type { PreparedYamlFile } from "../../project/preparedYamlProject"
import type { ConfigurationIndexReader } from "@nkdk/runtime"
import { bindDeferredObjectValues, type DeferredObjectValue } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { ClientApplicationFormRules } from "./rules"
import { buildClientApplicationBaseForm } from "./baseForm"

export const prepareFormXML = (params: {
  context: ConfigurationContextWithExportToXML
  preparedYamlFile: PreparedYamlFile
  formName: string
  currentXMLPath?: string
  referenceFormXML?: ClientApplicationFormXML
  referenceMetadataXML?: FormMetadataXML
  xmlManifest?: XmlWriteManifest
  profile?: import("../../ruleRuntime/property/fromYAMLToXMLTypes").YAMLToXMLProfile
  baseFormPreparedYamlFile?: PreparedYamlFile
  currentConfigurationFormPreparedYamlFile?: PreparedYamlFile
  baseFormSourceKind?: "saved" | "projected"
  baseConfigurationIndex?: ConfigurationIndexReader
  baseFormContext?: ConfigurationContextWithExportToXML
  rule?: MetadataItemRule
}): readonly {
  targetKind: "metadata" | "body"
  xml: Record<string, unknown>
  deferred: readonly DeferredObjectValue[]
  rootRule: MetadataItemRule
}[] => {
  const rule = params.rule ?? ClientApplicationFormRules
  const yamlObj = params.preparedYamlFile.data as ClientApplicationFormYAML | undefined
  if (yamlObj === undefined)
    throw new Error(`Подготовленные YAML-данные формы отсутствуют: ${params.preparedYamlFile.projectPath}`)
  const formDir = dirname(params.preparedYamlFile.filePath)
  const contextWithFormDir = createFormScopedContext({
    context: params.context,
    formDir,
    currentXMLPath: params.currentXMLPath,
  })
  const contextWithFormExternalMetadata = createFormExternalMetadataContext({
    context: contextWithFormDir,
    formName: params.formName,
  })
  const converted = convertClientApplicationFormFromYAMLToXML({
    context: contextWithFormExternalMetadata,
    yaml: yamlObj,
    name: params.formName,
    referenceFormXML: params.referenceFormXML,
    referenceMetadataXML: params.referenceMetadataXML,
    ...(params.currentConfigurationFormPreparedYamlFile === undefined
      ? {}
      : {
          currentConfigurationFormYaml:
            params.currentConfigurationFormPreparedYamlFile.data as ClientApplicationFormYAML,
          ...(params.baseFormSourceKind === "saved" && params.baseFormPreparedYamlFile !== undefined
            ? { savedBaseFormYaml: params.baseFormPreparedYamlFile.data as ClientApplicationFormYAML }
            : {}),
        }),
    ...(params.baseFormPreparedYamlFile === undefined
      ? {}
      : {
          baseFormXML: buildClientApplicationBaseForm({
            context: params.baseFormContext ?? contextWithFormExternalMetadata,
            ...(params.baseFormContext === undefined
              ? { baseIndex: requireBaseConfigurationIndex(params), extensionYaml: yamlObj }
              : {}),
            baseYaml: params.baseFormPreparedYamlFile.data as ClientApplicationFormYAML,
            ...(params.baseFormSourceKind === "projected" &&
              params.currentConfigurationFormPreparedYamlFile !== undefined
              ? {
                  currentConfigurationFormYaml:
                    params.currentConfigurationFormPreparedYamlFile.data as ClientApplicationFormYAML,
                }
              : {}),
            formName: params.formName,
            rule,
          }),
        }),
    profile: params.profile,
    rule,
  })
  const metadataDocument = { MetaDataObject: converted.metadataXML }
  const formDocument = { Form: converted.formXML }
  return [
    {
      targetKind: "metadata",
      xml: metadataDocument,
      deferred: bindDeferredObjectValues(
        metadataDocument,
        (converted.deferredByDocument.get("metadata") ?? []).map((entry) => ({
          ...entry,
          valuePath: ["MetaDataObject", ...entry.valuePath],
        }))
      ),
      rootRule: rule,
    },
    {
      targetKind: "body",
      xml: formDocument,
      deferred: bindDeferredObjectValues(
        formDocument,
        (converted.deferredByDocument.get("form") ?? []).map((entry) => ({
          ...entry,
          valuePath: ["Form", ...entry.valuePath],
        }))
      ),
      rootRule: rule,
    },
  ]
}

function requireBaseConfigurationIndex(params: {
  readonly baseFormPreparedYamlFile?: PreparedYamlFile
  readonly baseConfigurationIndex?: ConfigurationIndexReader
}): ConfigurationIndexReader {
  if (params.baseConfigurationIndex !== undefined) {
    return params.baseConfigurationIndex
  }
  throw new Error(
    "Для построения BaseForm не передан индекс основной конфигурации"
  )
}

export const writePreparedFormToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  preparedYamlFile: PreparedYamlFile
  formName: string
  outputDir: string
  currentXMLPath?: string
  referenceFormXML?: ClientApplicationFormXML
  referenceMetadataXML?: FormMetadataXML
  xmlManifest?: XmlWriteManifest
  profile?: import("../../ruleRuntime/property/fromYAMLToXMLTypes").YAMLToXMLProfile
  rule?: MetadataItemRule
}): Promise<void> => {
  const prepared = prepareFormXML(params)
  const metadataDocument = prepared.find((document) => document.targetKind === "metadata")?.xml
  const formDocument = prepared.find((document) => document.targetKind === "body")?.xml
  const contextWithFormDir = createFormScopedContext({
    context: params.context,
    formDir: dirname(params.preparedYamlFile.filePath),
    currentXMLPath: params.currentXMLPath,
  })
  const contextWithFormExternalMetadata = createFormExternalMetadataContext({
    context: contextWithFormDir,
    formName: params.formName,
  })
  await writeFormToXML({
    context: contextWithFormExternalMetadata,
    formXML: formDocument?.Form as ClientApplicationFormXML,
    metadataXML: metadataDocument?.MetaDataObject as FormMetadataXML,
    formName: params.formName,
    outputDir: params.outputDir,
    xmlManifest: params.xmlManifest,
  })
}

function createFormExternalMetadataContext(params: {
  context: ConfigurationContextWithExportToXML
  formName: string
}): ConfigurationContextWithExportToXML {
  const formItem: ExternalMetadataContextItem = {
    itemType: "ClientApplicationForm" as never,
    name: params.formName,
    path: `ClientApplicationForm.${params.formName}`,
    externalMetadata: { segment: "Form", placement: "ownedEntry" },
  }

  return {
    ...params.context,
    exportToXML: {
      ...params.context.exportToXML,
      itemsTree: [...params.context.exportToXML.itemsTree, formItem],
    },
  }
}

const createFormScopedContext = (params: {
  context: ConfigurationContextWithExportToXML
  formDir: string
  currentXMLPath?: string
}): ConfigurationContextWithExportToXML => {
  const { context, formDir, currentXMLPath } = params
  const exportContext = context.exportToXML.context

  if (exportContext === undefined) {
    throw new Error("exportToXML.context обязателен для синхронизации формы в XML")
  }

  return {
    ...context,
    importFromYAML: {
      ...(context.importFromYAML ?? {}),
      formDir,
    },
    exportToXML: {
      ...context.exportToXML,
      context: {
        ...exportContext,
        metadataForNumbering: [],
        currentXMLPath: currentXMLPath ?? exportContext.currentXMLPath,
        propertiesItemXmlStack: [],
      },
    },
  }
}

const writeFormToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  formXML: ClientApplicationFormXML | undefined
  metadataXML: FormMetadataXML
  formName: string
  outputDir: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  const { formXML, metadataXML, formName, outputDir } = params

  const formsOutDir = join(outputDir, "Forms")
  const formMetadataPath = join(formsOutDir, `${formName}.xml`)
  const formExtDir = join(formsOutDir, formName, "Ext")
  const formXmlPath = join(formExtDir, "Form.xml")

  await fs.promises.mkdir(formsOutDir, { recursive: true })

  await fs.promises.writeFile(formMetadataPath, xmlExport({ MetaDataObject: metadataXML }), "utf-8")
  params.xmlManifest?.addFile(formMetadataPath)
  if (formXML !== undefined) {
    await fs.promises.mkdir(formExtDir, { recursive: true })
    await fs.promises.writeFile(formXmlPath, xmlExport({ Form: formXML }), "utf-8")
    params.xmlManifest?.addFile(formXmlPath)
  }
}
