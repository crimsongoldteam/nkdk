import fs from "fs"
import { dirname, join } from "path"
import { ConfigurationContextWithExportToXML } from "../../context/types"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"
import type { ExternalMetadataContextItem } from "../../orchestration/externalMetadata/types"
import type { ClientApplicationFormXML, ClientApplicationFormYAML, FormMetadataXML } from "./types"
import { xmlExport } from "../../../xml/export/exporter"
import { importFromYAML } from "../../../yaml/import"
import importContentFromXML from "../../../xml/import/importer"
import { copyFormItemExternalFilesToXML } from "./externalItemFiles"
import { copyExistingRawFile, copyRawDirectoryFiles } from "./externalRawFiles"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import type { PreparedYamlFile } from "../../project/preparedYamlProject"

export const syncFormToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  formName: string
  outputDir: string
  referenceDir?: string
  currentXMLPath?: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  const { context, inputDir, formName, outputDir } = params
  const referenceDir = params.referenceDir

  const { yamlContent, formDir } = await readFormFiles({ inputDir, formName })

  const yamlObj = importFromYAML<ClientApplicationFormYAML>(yamlContent)

  const contextWithFormDir = createFormScopedContext({ context, formDir, currentXMLPath: params.currentXMLPath })
  const contextWithFormExternalMetadata = createFormExternalMetadataContext({
    context: contextWithFormDir,
    formName,
  })

  const effectiveReferenceDir =
    referenceDir && hasReferenceFormMetadata({ referenceDir, formName }) ? referenceDir : undefined
  const reference = effectiveReferenceDir
    ? readRawReferenceForm({ referenceDir: effectiveReferenceDir, formName })
    : undefined
  const converted = convertClientApplicationFormFromYAMLToXML({
    context: contextWithFormExternalMetadata,
    yaml: yamlObj,
    name: formName,
    referenceFormXML: reference?.formXML,
    referenceMetadataXML: reference?.metadataXML,
  })
  const isOrdinaryForm = converted.metadataXML.Form?.Properties?.FormType === "Ordinary"
  const referenceHasFormXML = effectiveReferenceDir
    ? hasReferenceFormXML({ referenceDir: effectiveReferenceDir, formName })
    : true

  const formXML = isOrdinaryForm && !referenceHasFormXML ? undefined : converted.formXML
  const metadataXML = converted.metadataXML

  await writeFormToXML({
    context: contextWithFormExternalMetadata,
    formXML,
    metadataXML,
    formName,
    outputDir,
    xmlManifest: params.xmlManifest,
  })
  if (formXML !== undefined) {
    contextWithFormExternalMetadata.exportToXML.externalMetadataCollector?.recordDerived({
      itemsTree: contextWithFormExternalMetadata.exportToXML.itemsTree,
      segment: "Form",
    })
  }
  if (formXML !== undefined) {
    await copyFormItemExternalFilesToXML({
      formNkdkDir: formDir,
      formXmlDir: join(outputDir, "Forms", formName, "Ext"),
      xmlManifest: params.xmlManifest,
    })
  }
  await copyFormHelpFilesToXML({ formDir, formName, outputDir, xmlManifest: params.xmlManifest })
  await copyFormBinToXML({ formDir, formName, outputDir, xmlManifest: params.xmlManifest })
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
  profile?: import("../../orchestration/property/fromYAMLToXMLTypes").YAMLToXMLProfile
}): Promise<void> => {
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
    profile: params.profile,
  })

  await writeFormToXML({
    context: contextWithFormExternalMetadata,
    formXML: converted.formXML,
    metadataXML: converted.metadataXML,
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

async function readFormFiles(params: { inputDir: string; formName: string }): Promise<{
  yamlContent: string
  formDir: string
}> {
  const { inputDir, formName } = params
  const formsDir = join(inputDir, "Формы")
  const formDir = join(formsDir, formName)
  const yamlPath = join(formDir, "Форма.yaml")

  const yamlContent = await fs.promises.readFile(yamlPath, "utf-8")

  return { yamlContent, formDir }
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

const hasReferenceFormXML = (params: { referenceDir: string; formName: string }): boolean =>
  fs.existsSync(join(params.referenceDir, params.formName, "Ext", "Form.xml"))

const hasReferenceFormMetadata = (params: { referenceDir: string; formName: string }): boolean =>
  fs.existsSync(join(params.referenceDir, `${params.formName}.xml`))

function readRawReferenceForm(params: { referenceDir: string; formName: string }): {
  formXML?: ClientApplicationFormXML
  metadataXML: FormMetadataXML
} {
  const metadataText = fs.readFileSync(join(params.referenceDir, `${params.formName}.xml`), "utf8")
  const metadataXML = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(metadataText, {
    preserveXsiNil: true,
    preserveEmptyElements: true,
  }).MetaDataObject
  const formPath = join(params.referenceDir, params.formName, "Ext", "Form.xml")
  const formXML = fs.existsSync(formPath)
    ? importContentFromXML<{ Form: ClientApplicationFormXML }>(fs.readFileSync(formPath, "utf8"), {
        preserveXsiNil: true,
        preserveEmptyElements: true,
      }).Form
    : undefined
  return { metadataXML, formXML }
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

const copyFormBinToXML = async (params: {
  formDir: string
  formName: string
  outputDir: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  const sourcePath = join(params.formDir, "Form.bin")
  const targetPath = join(params.outputDir, "Forms", params.formName, "Ext", "Form.bin")
  await copyExistingRawFile({ sourcePath, targetPath, xmlManifest: params.xmlManifest })
}

const copyFormHelpFilesToXML = async (params: {
  formDir: string
  formName: string
  outputDir: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  await copyRawDirectoryFiles({
    sourceDir: join(params.formDir, "Справка", "_files"),
    targetDir: join(params.outputDir, "Forms", params.formName, "Ext", "Help", "_files"),
    xmlManifest: params.xmlManifest,
  })
}
