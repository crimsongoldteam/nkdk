import fs from "fs"
import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, type Form as NkdkForm } from "nkdk-language"
import { join } from "path"
import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "~/metadata/context/types"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "~/metadata/forms/clientApplicationForm/toXML"
import type {
  ClientApplicationForm,
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
  FormMetadataXML,
} from "~/metadata/forms/clientApplicationForm/types"
import { xmlExport } from "~/xml/export/exporter"
import { importFromYAML } from "~/yaml/import"
import { readFormFromXML } from "./convertFromXML"
import { importClientApplicationFromFromNKDK } from "./fromNKDK"

export const syncFormToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  formName: string
  outputDir: string
  referenceDir?: string
}): Promise<void> => {
  const { context, inputDir, formName, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir

  const { yamlContent, nkdkContent } = readFormFiles({ inputDir, formName })

  const yamlObj = importFromYAML<ClientApplicationFormYAML>(yamlContent)
  const formFromNkdk = await parseFormFromNkdKString(context, nkdkContent)
  if (!formFromNkdk) {
    throw new Error(`Failed to parse NKDK for form "${formName}"`)
  }

  const form = importClientApplicationFormFromYAML(context, yamlObj, formFromNkdk)

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

  const formXML = exportClientApplicationFormToXML({ context, form, referenceForm })
  const metadataXML = exportFormMetadataToXML({
    context,
    form,
    referenceForm: referenceForm,
    name: formName,
  })

  await writeFormToXML({ context, formXML, metadataXML, formName, outputDir })
}

function readFormFiles(params: { inputDir: string; formName: string }): {
  yamlContent: string
  nkdkContent: string
} {
  const { inputDir, formName } = params
  const formsDir = join(inputDir, "Формы")
  const formDir = join(formsDir, formName)
  const yamlPath = join(formDir, "Форма.yaml")
  const nkdkPath = join(formDir, "Форма.nkdk")

  const yamlContent = fs.readFileSync(yamlPath, "utf-8")
  const nkdkContent = fs.readFileSync(nkdkPath, "utf-8")

  return { yamlContent, nkdkContent }
}

const writeFormToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  formXML: ClientApplicationFormXML
  metadataXML: FormMetadataXML
  formName: string
  outputDir: string
}): Promise<void> => {
  const { formXML, metadataXML, formName, outputDir } = params

  const formsOutDir = join(outputDir, "Forms")
  const formMetadataPath = join(formsOutDir, `${formName}.xml`)
  const formExtDir = join(formsOutDir, formName, "Ext")
  const formXmlPath = join(formExtDir, "Form.xml")

  fs.mkdirSync(formExtDir, { recursive: true })

  fs.writeFileSync(formMetadataPath, xmlExport({ MetaDataObject: metadataXML }), "utf-8")
  fs.writeFileSync(formXmlPath, xmlExport({ Form: formXML }), "utf-8")
}

let parseHelperCached: ReturnType<typeof parseHelper<NkdkForm>> | null = null

function getNkdKParse(): ReturnType<typeof parseHelper<NkdkForm>> {
  if (!parseHelperCached) {
    const services = createNkdkServices(EmptyFileSystem)
    parseHelperCached = parseHelper<NkdkForm>(services.Nkdk)
  }
  return parseHelperCached
}

const parseFormFromNkdKString = async (
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
