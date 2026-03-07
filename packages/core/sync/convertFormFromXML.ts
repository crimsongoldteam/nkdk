import fs from "fs"
import { join } from "path"
import { ConfigurationContext } from "~/metadata/context/types"
import { importClientApplicationFormFromXML } from "~/metadata/forms/clientApplicationForm/fromXML"
import { exportClientApplicationFormToNKDK } from "~/metadata/forms/clientApplicationForm/toNKDK"
import { exportClientApplicationFormToYAML } from "~/metadata/forms/clientApplicationForm/toYAML"
import type { ClientApplicationFormXML, FormMetadataXML } from "~/metadata/forms/clientApplicationForm/types"
import { importContentFromXML } from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"

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

  const metadataPath = join(inputDir, `${formName}.xml`)
  const metadataXML = fs.readFileSync(metadataPath, "utf-8")

  const formPath = join(inputDir, formName, "Ext", "Form.xml")
  const formXML = fs.readFileSync(formPath, "utf-8")

  const formMetadataXML = await readFormFromXML({
    context,
    formXML,
    metadataXML,
    formName,
  })

  const formOutputPath = join(outputDir, "Формы", formName)
  fs.mkdirSync(formOutputPath, { recursive: true })

  if (formMetadataXML.yaml) {
    const yamlFilePath = join(formOutputPath, "Форма.yaml")
    fs.writeFileSync(yamlFilePath, formMetadataXML.yaml, "utf-8")
  }

  if (formMetadataXML.nkdk) {
    const nkdkPath = join(formOutputPath, "Форма.nkdk")
    fs.writeFileSync(nkdkPath, formMetadataXML.nkdk, "utf-8")
  }
}

const readFormFromXML = async (params: {
  context: ConfigurationContext
  formXML: string
  metadataXML: string
  formName: string
}): Promise<ReadFormFromXMLResult> => {
  const { context, formXML, metadataXML } = params

  const parsedForm = importContentFromXML<{ Form: ClientApplicationFormXML }>(formXML)
  const parsedMetadata = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(metadataXML)

  const form = importClientApplicationFormFromXML(context, parsedForm.Form, parsedMetadata.MetaDataObject)

  const yamlObj = exportClientApplicationFormToYAML(context, form)
  const yaml = yamlObj != null ? exportToYAML(yamlObj) : undefined

  const nkdkResult = exportClientApplicationFormToNKDK(context, form)
  const nkdk = nkdkResult.strings.join("\n")

  return { yaml, nkdk }
}
