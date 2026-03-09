import fs from "fs"
import { join } from "path"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportClientApplicationFormToNKDK } from "~/metadata/forms/clientApplicationForm/toNKDK"
import { exportClientApplicationFormToYAML } from "~/metadata/forms/clientApplicationForm/toYAML"
import importContentFromXML from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"
import { importClientApplicationFormFromXML } from "./fromXML"
import {
  ClientApplicationForm,
  ClientApplicationFormReference,
  ClientApplicationFormXML,
  FormMetadataXML,
} from "./types"

export type ReadFormFromXMLResult = {
  yaml: string | undefined
  nkdk: string | undefined
}

export const convertFormFromXML = async (params: {
  context: ConfigurationContext
  inputDir: string
  formName: string
  outputDir: string
}): Promise<void> => {
  const { context, inputDir, formName, outputDir } = params

  const form = readFormFromXML({ context, inputDir, formName, forReference: false })

  const { yaml, nkdk } = await convertFormToYAMLAndNKDK({ context, form })

  await writeFormToYAMLAndNKDK({ context, formYAML: yaml, formNKDK: nkdk, formName, outputDir })
}

export function readFormFromXML(params: {
  context: ConfigurationContext
  inputDir: string
  formName: string
  forReference: false
}): ClientApplicationForm
export function readFormFromXML(params: {
  context: ConfigurationContext
  inputDir: string
  formName: string
  forReference: true
}): ClientApplicationFormReference
export function readFormFromXML(params: {
  context: ConfigurationContext
  inputDir: string
  formName: string
  forReference: boolean
}): ClientApplicationForm {
  const { context, inputDir, formName, forReference } = params

  const metadataPath = join(inputDir, `${formName}.xml`)
  const metadataXML = fs.readFileSync(metadataPath, "utf-8")

  const formPath = join(inputDir, formName, "Ext", "Form.xml")
  const formXML = fs.readFileSync(formPath, "utf-8")

  const form = forReference
    ? parseFormFromXML({ context, formXML, metadataXML, forReference: true })
    : parseFormFromXML({ context, formXML, metadataXML, forReference: false })

  return form
}

const writeFormToYAMLAndNKDK = async (params: {
  context: ConfigurationContext
  formYAML: string | undefined
  formNKDK: string | undefined
  formName: string
  outputDir: string
}): Promise<void> => {
  const { formYAML, formNKDK, formName, outputDir } = params

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
}

function parseFormFromXML(params: {
  context: ConfigurationContext
  formXML: string
  metadataXML: string
  forReference: false
}): ClientApplicationForm
function parseFormFromXML(params: {
  context: ConfigurationContext
  formXML: string
  metadataXML: string
  forReference: true
}): ClientApplicationFormReference
function parseFormFromXML(params: {
  context: ConfigurationContext
  formXML: string
  metadataXML: string
  forReference: boolean
}): ClientApplicationForm | ClientApplicationFormReference {
  const { context, formXML, metadataXML, forReference } = params

  const parsedForm = importContentFromXML<{ Form: ClientApplicationFormXML }>(formXML)
  const parsedMetadata = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(metadataXML)

  return importClientApplicationFormFromXML({
    context,
    xml: parsedForm.Form,
    xmlMetadata: parsedMetadata.MetaDataObject,
    ...(forReference ? { forReference: true as const } : {}),
  })
}

const convertFormToYAMLAndNKDK = async (params: {
  context: ConfigurationContext
  form: ClientApplicationForm
}): Promise<ReadFormFromXMLResult> => {
  const { context, form } = params

  const yamlObj = exportClientApplicationFormToYAML(context, form)
  const yaml = yamlObj != null ? exportToYAML(yamlObj) : undefined

  const nkdkResult = exportClientApplicationFormToNKDK(context, form)
  const nkdk = nkdkResult.strings.join("\n")

  return { yaml, nkdk }
}
