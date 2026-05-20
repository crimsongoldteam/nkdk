import fs from "fs"
import { join } from "path"
import "~/metadata/commonObjects"
import { ConfigurationContext, ConfigurationContextFromXML, ExternalFileEntry } from "~/metadata/context/types"
import { exportClientApplicationFormToYAML } from "~/metadata/forms/clientApplicationForm/toYAML"
import importContentFromXML from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"
import { copyFormItemExternalFilesFromXML } from "./externalItemFiles"
import { importClientApplicationFormFromXML } from "./fromXML"
import { ClientApplicationForm, ClientApplicationFormXML, FormMetadataXML } from "./types"

export type ReadFormFromXMLResult = {
  yaml: string | undefined
  externalFiles: ExternalFileEntry[]
}

export const convertFormFromXML = async (params: {
  context: ConfigurationContextFromXML
  inputDir: string
  formName: string
  outputDir: string
}): Promise<void> => {
  const { context, inputDir, formName, outputDir } = params

  const metadataPath = join(inputDir, `${formName}.xml`)
  const metadataXML = await fs.promises.readFile(metadataPath, "utf-8")

  const formPath = join(inputDir, formName, "Ext", "Form.xml")
  const formXML = await fs.promises.readFile(formPath, "utf-8")

  const form = parseFormFromXML({ context, formXML, metadataXML })

  const { yaml, externalFiles } = await convertFormToYAML({ context, form })

  await writeFormToYAML({ formYAML: yaml, externalFiles, formName, outputDir })
  await copyFormItemExternalFilesFromXML({
    formXmlDir: join(inputDir, formName, "Ext"),
    formNkdkDir: join(outputDir, "Формы", formName),
  })
}

export function readFormFromXML(params: {
  context: ConfigurationContextFromXML
  inputDir: string
  formName: string
}): ClientApplicationForm {
  const { context, inputDir, formName } = params

  const metadataPath = join(inputDir, `${formName}.xml`)
  const metadataXML = fs.readFileSync(metadataPath, "utf-8")

  const formPath = join(inputDir, formName, "Ext", "Form.xml")
  const formXML = fs.readFileSync(formPath, "utf-8")

  const form = parseFormFromXML({ context, formXML, metadataXML })

  return form
}

const writeFormToYAML = async (params: {
  formYAML: string | undefined
  externalFiles: ExternalFileEntry[]
  formName: string
  outputDir: string
}): Promise<void> => {
  const { formYAML, externalFiles, formName, outputDir } = params

  const formOutputPath = join(outputDir, "Формы", formName)
  await fs.promises.mkdir(formOutputPath, { recursive: true })

  if (formYAML) {
    const yamlFilePath = join(formOutputPath, "Форма.yaml")
    await fs.promises.writeFile(yamlFilePath, formYAML, "utf-8")
  }

  for (const { relativePath, content } of externalFiles) {
    const filePath = join(formOutputPath, relativePath)
    await fs.promises.mkdir(join(filePath, ".."), { recursive: true })
    await fs.promises.writeFile(filePath, content, "utf-8")
  }
}

function parseFormFromXML(params: {
  context: ConfigurationContextFromXML
  formXML: string
  metadataXML: string
}): ClientApplicationForm {
  const { context, formXML, metadataXML } = params

  const parsedForm = importContentFromXML<{ Form: ClientApplicationFormXML }>(formXML, { preserveXsiNil: true })
  const parsedMetadata = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(metadataXML)

  return importClientApplicationFormFromXML({
    context,
    xml: parsedForm.Form,
    xmlMetadata: parsedMetadata.MetaDataObject,
  })
}

const convertFormToYAML = async (params: {
  context: ConfigurationContext
  form: ClientApplicationForm
}): Promise<ReadFormFromXMLResult> => {
  const { context, form } = params

  const { yaml: yamlObj, externalFiles } = exportClientApplicationFormToYAML(context, form)
  const yaml = yamlObj != null ? exportToYAML(yamlObj) : undefined

  return { yaml, externalFiles }
}
