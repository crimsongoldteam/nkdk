import fs from "fs"
import { join } from "path"
import { ConfigurationContext, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "~/metadata/forms/clientApplicationForm/toXML"
import type { ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/types"
import { xmlExport } from "~/xml/export/exporter"
import { importFromYAML } from "~/yaml/import"
import { parseFormFromNkdKString } from "./parseFormFromNkdK"

export type ParseFormFromNkdK = (
  context: ConfigurationContext,
  nkdkString: string
) => Promise<import("~/metadata/forms/clientApplicationForm/types").ClientApplicationForm | undefined>

export const convertFormToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  formName: string
  outputDir: string
  parseNkdK?: ParseFormFromNkdK
}): Promise<void> => {
  const { context, inputDir, formName, outputDir, parseNkdK = parseFormFromNkdKString } = params

  const formsDir = join(inputDir, "Формы")
  const formDir = join(formsDir, formName)
  const yamlPath = join(formDir, "Форма.yaml")
  const nkdkPath = join(formDir, "Форма.nkdk")

  const yamlContent = fs.readFileSync(yamlPath, "utf-8")
  const nkdkContent = fs.readFileSync(nkdkPath, "utf-8")

  const yamlObj = importFromYAML<ClientApplicationFormYAML>(yamlContent)
  const formFromNkdk = await parseNkdK(context, nkdkContent)
  if (!formFromNkdk) {
    throw new Error(`Failed to parse NKDK for form "${formName}"`)
  }

  const form: import("~/metadata/forms/clientApplicationForm/types").ClientApplicationForm = {
    ...importClientApplicationFormFromYAML(context, yamlObj, formFromNkdk),
    childItems: formFromNkdk.childItems,
    commands: formFromNkdk.commands ?? [],
  }

  const formXml = exportClientApplicationFormToXML({ context, form: form, referenceForm: form })
  const metadataXml = exportFormMetadataToXML(context, undefined, form, formName)

  if (!formXml) {
    return
  }

  const formsOutDir = join(outputDir, "Forms")
  const formMetadataPath = join(formsOutDir, `${formName}.xml`)
  const formExtDir = join(formsOutDir, formName, "Ext")
  const formXmlPath = join(formExtDir, "Form.xml")

  fs.mkdirSync(formExtDir, { recursive: true })

  fs.writeFileSync(formMetadataPath, xmlExport({ MetaDataObject: metadataXml }), "utf-8")
  fs.writeFileSync(formXmlPath, xmlExport({ Form: formXml }), "utf-8")
}
