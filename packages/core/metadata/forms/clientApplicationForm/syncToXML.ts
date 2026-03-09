import fs from "fs"
import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices } from "nkdk-language"
import { join } from "path"
import { ConfigurationContext, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "~/metadata/forms/clientApplicationForm/toXML"
import type { ClientApplicationForm, ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/types"
import { xmlExport } from "~/xml/export/exporter"
import { importFromYAML } from "~/yaml/import"
import { parseFormFromXML } from "./convertFromXML"
import { importClientApplicationFromFromNKDK } from "./fromNKDK"

export const convertFormToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  formName: string
  outputDir: string
}): Promise<void> => {
  const { context, inputDir, formName, outputDir } = params

  const formsDir = join(inputDir, "Формы")
  const formDir = join(formsDir, formName)
  const yamlPath = join(formDir, "Форма.yaml")
  const nkdkPath = join(formDir, "Форма.nkdk")

  const yamlContent = fs.readFileSync(yamlPath, "utf-8")
  const nkdkContent = fs.readFileSync(nkdkPath, "utf-8")

  const yamlObj = importFromYAML<ClientApplicationFormYAML>(yamlContent)
  const formFromNkdk = await parseFormFromNkdKString(context, nkdkContent)
  if (!formFromNkdk) {
    throw new Error(`Failed to parse NKDK for form "${formName}"`)
  }

  const form = importClientApplicationFormFromYAML(context, yamlObj, formFromNkdk)

  const referenceForm: ClientApplicationFormRef | undefined
  if (referenceFormInputDir != null && referenceFormName != null) {
    const metadataPath = join(referenceFormInputDir, `${referenceFormName}.xml`)
    const formPath = join(referenceFormInputDir, referenceFormName, "Ext", "Form.xml")
    const metadataXML = fs.readFileSync(metadataPath, "utf-8")
    const formXML = fs.readFileSync(formPath, "utf-8")
    referenceForm = parseFormFromXML({ context, formXML, metadataXML, forReference: true })
  } else {
    referenceForm = form as ClientApplicationFormRef
  }

  const formXml = exportClientApplicationFormToXML({ context, form, referenceForm })
  const metadataXml = exportFormMetadataToXML({
    context,
    form,
    referenceForm: referenceForm as ClientApplicationFormMetadataRef | undefined,
    name: formName,
  })

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

let parseHelperCached: ReturnType<typeof parseHelper<NkdkForm>> | null = null

function getNkdKParse(): ReturnType<typeof parseHelper<NkdkForm>> {
  if (!parseHelperCached) {
    const services = createNkdkServices(EmptyFileSystem)
    parseHelperCached = parseHelper<NkdkForm>(services.Nkdk)
  }
  return parseHelperCached
}

export const parseFormFromNkdKString = async (
  context: ConfigurationContext,
  nkdkString: string
): Promise<ClientApplicationForm | undefined> => {
  const nkdkParse = getNkdKParse()
  const result = await nkdkParse(nkdkString)
  if (!result || result.parseResult.parserErrors.length > 0) {
    return undefined
  }
  return importClientApplicationFromFromNKDK({
    context,
    value: result.parseResult.value,
  })
}
