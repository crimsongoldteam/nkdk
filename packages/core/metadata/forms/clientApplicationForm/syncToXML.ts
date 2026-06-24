import fs from "fs"
import { join } from "path"
import { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "~/metadata/forms/clientApplicationForm/toXML"
import type {
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
  FormMetadataXML,
} from "~/metadata/forms/clientApplicationForm/types"
import { xmlExport } from "~/xml/export/exporter"
import { importFromYAML } from "~/yaml/import"
import { readFormFromXML } from "./convertFromXML"
import { copyFormItemExternalFilesToXML } from "./externalItemFiles"
import { copyExistingRawFile, copyRawDirectoryFiles } from "./externalRawFiles"
import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"

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

  const contextFromXML: ConfigurationContextFromXML = {
    fromXML: {
      forReference: true,
    },
    defaultLanguage: context.defaultLanguage,
    version: "2.20",
  }
  const effectiveReferenceDir =
    referenceDir && hasReferenceFormMetadata({ referenceDir, formName }) ? referenceDir : undefined
  const referenceForm = effectiveReferenceDir
    ? readFormFromXML({
        context: contextFromXML,
        inputDir: effectiveReferenceDir,
        formName,
      })
    : undefined

  const form = importClientApplicationFormFromYAML(contextWithFormDir, yamlObj, referenceForm)
  const isOrdinaryForm = form.formType === "Ordinary"
  const referenceHasFormXML = effectiveReferenceDir ? hasReferenceFormXML({ referenceDir: effectiveReferenceDir, formName }) : true

  const formXML =
    isOrdinaryForm && !referenceHasFormXML
      ? undefined
      : exportClientApplicationFormToXML({ context: contextWithFormDir, form, referenceForm })
  const metadataXML = exportFormMetadataToXML({
    context: contextWithFormDir,
    form,
    referenceForm: referenceForm,
    name: formName,
  })

  await writeFormToXML({
    context: contextWithFormDir,
    formXML,
    metadataXML,
    formName,
    outputDir,
    xmlManifest: params.xmlManifest,
  })
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
