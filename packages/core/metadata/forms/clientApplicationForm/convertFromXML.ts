import fs from "fs"
import { join } from "path"
import { ConfigurationContext, ConfigurationContextFromXML, ExternalFileEntry } from "~/metadata/context/types"
import { exportClientApplicationFormToNKDK } from "~/metadata/forms/clientApplicationForm/toNKDK"
import { exportClientApplicationFormToYAML } from "~/metadata/forms/clientApplicationForm/toYAML"
import importContentFromXML from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"
import { importClientApplicationFormFromXML } from "./fromXML"
import { ClientApplicationForm, ClientApplicationFormXML, FormMetadataXML } from "./types"

export type ReadFormFromXMLResult = {
  yaml: string | undefined
  nkdk: string | undefined
  externalFiles: ExternalFileEntry[]
}

export const convertFormFromXML = async (params: {
  context: ConfigurationContextFromXML
  inputDir: string
  formName: string
  outputDir: string
}): Promise<void> => {
  const { context, inputDir, formName, outputDir } = params

  const form = readFormFromXML({ context, inputDir, formName })

  const { yaml, nkdk, externalFiles } = await convertFormToYAMLAndNKDK({ context, form })

  await writeFormToYAMLAndNKDK({ context, formYAML: yaml, formNKDK: nkdk, externalFiles, formName, outputDir })
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

const writeFormToYAMLAndNKDK = async (params: {
  context: ConfigurationContext
  formYAML: string | undefined
  formNKDK: string | undefined
  externalFiles: ExternalFileEntry[]
  formName: string
  outputDir: string
}): Promise<void> => {
  const { formYAML, formNKDK, externalFiles, formName, outputDir } = params

  const formOutputPath = join(outputDir, "Формы", formName)
  fs.mkdirSync(formOutputPath, { recursive: true })

  if (formYAML) {
    const yamlFilePath = join(formOutputPath, "Форма.yaml")
    fs.writeFileSync(yamlFilePath, formYAML, "utf-8")
  }

  if (formNKDK) {
    const nkdkPath = join(formOutputPath, "Форма.nkdk")
    fs.writeFileSync(nkdkPath, formNKDK, "utf-8")
  }

  for (const { relativePath, content } of externalFiles) {
    const filePath = join(formOutputPath, relativePath)
    fs.mkdirSync(join(filePath, ".."), { recursive: true })
    fs.writeFileSync(filePath, content, "utf-8")
  }
}

function parseFormFromXML(params: {
  context: ConfigurationContextFromXML
  formXML: string
  metadataXML: string
}): ClientApplicationForm {
  const { context, formXML, metadataXML } = params

  const parsedForm = importContentFromXML<{ Form: ClientApplicationFormXML }>(formXML)
  const parsedMetadata = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(metadataXML)

  return importClientApplicationFormFromXML({
    context,
    xml: parsedForm.Form,
    xmlMetadata: parsedMetadata.MetaDataObject,
  })
}

const convertFormToYAMLAndNKDK = async (params: {
  context: ConfigurationContext
  form: ClientApplicationForm
}): Promise<ReadFormFromXMLResult> => {
  const { context, form } = params

  const { yaml: yamlObj, externalFiles } = exportClientApplicationFormToYAML(context, form)
  const yaml = yamlObj != null ? exportToYAML(yamlObj) : undefined

  const nkdkResult = exportClientApplicationFormToNKDK(context, form)
  const nkdk = nkdkResult.strings.join("\n")

  return { yaml, nkdk, externalFiles }
}
