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

export const syncFormToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  formName: string
  outputDir: string
  referenceDir?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const { context, inputDir, formName, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir

  const { yamlContent, formDir } = await readFormFiles({ inputDir, formName })

  const yamlObj = importFromYAML<ClientApplicationFormYAML>(yamlContent)

  const contextWithFormDir = createFormScopedContext({ context, formDir })

  const form = importClientApplicationFormFromYAML(contextWithFormDir, yamlObj)

  const contextFromXML: ConfigurationContextFromXML = {
    fromXML: {
      forReference: true,
    },
    defaultLanguage: context.defaultLanguage,
    version: "2.20",
  }
  const referenceForm = readFormFromXML({
    context: contextFromXML,
    inputDir: referenceDir,
    formName,
  })

  const formXML = exportClientApplicationFormToXML({ context: contextWithFormDir, form, referenceForm })
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
  await copyFormItemExternalFilesToXML({
    formNkdkDir: formDir,
    formXmlDir: join(outputDir, "Forms", formName, "Ext"),
    xmlManifest: params.xmlManifest,
  })
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
}): ConfigurationContextWithExportToXML => {
  const { context, formDir } = params
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
        propertiesItemXmlStack: [],
      },
    },
  }
}

const writeFormToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  formXML: ClientApplicationFormXML
  metadataXML: FormMetadataXML
  formName: string
  outputDir: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const { formXML, metadataXML, formName, outputDir } = params

  const formsOutDir = join(outputDir, "Forms")
  const formMetadataPath = join(formsOutDir, `${formName}.xml`)
  const formExtDir = join(formsOutDir, formName, "Ext")
  const formXmlPath = join(formExtDir, "Form.xml")

  await fs.promises.mkdir(formsOutDir, { recursive: true })
  await fs.promises.mkdir(formExtDir, { recursive: true })

  await fs.promises.writeFile(formMetadataPath, xmlExport({ MetaDataObject: metadataXML }), "utf-8")
  await fs.promises.writeFile(formXmlPath, xmlExport({ Form: formXML }), "utf-8")
  params.xmlManifest?.addFile(formMetadataPath)
  params.xmlManifest?.addFile(formXmlPath)
}
