import fs from "fs"
import { join } from "path"
import "../../commonObjects"
import { ConfigurationContext, ConfigurationContextFromXML, ExternalFileEntry } from "../../context/types"
import { exportClientApplicationFormToYAML } from "./toYAML"
import importContentFromXML from "../../../xml/import/importer"
import { exportToYAML } from "../../../yaml/export"
import { copyFormItemExternalFilesFromXML } from "./externalItemFiles"
import { copyExistingRawFile, copyRawDirectoryFiles } from "./externalRawFiles"
import { importClientApplicationFormFromXML } from "./fromXML"
import { ClientApplicationForm, ClientApplicationFormXML, FormMetadataXML } from "./types"
import { childUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "../../configurationIndex/collector/context"

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

  const { formXML, hasFormBin } = await readFormBodyFromXML({ inputDir, formName, metadataXML })
  const collection = getConfigurationIndexCollectionContext(context)
  const formContext =
    collection === undefined
      ? context
      : withConfigurationIndexLogicalAddress(context, childUid(collection.logicalAddress, "Форма", formName))
  const form = parseFormFromXML({ context: formContext, formXML, metadataXML })

  const { yaml, externalFiles } = await convertFormToYAML({ context: formContext, form, formName })

  await writeFormToYAML({ formYAML: yaml, externalFiles, formName, outputDir })
  if (hasFormBin) {
    await copyFormBinFromXML({ inputDir, formName, outputDir })
  }
  await copyFormHelpFilesFromXML({ inputDir, formName, outputDir })
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

  const formXML = readFormBodyFromXMLSync({ inputDir, formName, metadataXML }).formXML

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

const readFormBodyFromXML = async (params: {
  inputDir: string
  formName: string
  metadataXML: string
}): Promise<{ formXML: string | undefined; hasFormBin: boolean }> => {
  const { inputDir, formName, metadataXML } = params
  const formPath = join(inputDir, formName, "Ext", "Form.xml")
  const formBinPath = join(inputDir, formName, "Ext", "Form.bin")
  const isOrdinaryForm = getFormTypeFromMetadataXML(metadataXML) === "Ordinary"

  try {
    return { formXML: await fs.promises.readFile(formPath, "utf-8"), hasFormBin: fs.existsSync(formBinPath) }
  } catch (error) {
    if (!isMissingFileError(error)) throw error
    if (!isOrdinaryForm) throw error
    return { formXML: undefined, hasFormBin: fs.existsSync(formBinPath) }
  }
}

const readFormBodyFromXMLSync = (params: {
  inputDir: string
  formName: string
  metadataXML: string
}): { formXML: string | undefined; hasFormBin: boolean } => {
  const { inputDir, formName, metadataXML } = params
  const formPath = join(inputDir, formName, "Ext", "Form.xml")
  const formBinPath = join(inputDir, formName, "Ext", "Form.bin")
  const isOrdinaryForm = getFormTypeFromMetadataXML(metadataXML) === "Ordinary"

  try {
    return { formXML: fs.readFileSync(formPath, "utf-8"), hasFormBin: fs.existsSync(formBinPath) }
  } catch (error) {
    if (!isMissingFileError(error)) throw error
    if (!isOrdinaryForm) throw error
    return { formXML: undefined, hasFormBin: fs.existsSync(formBinPath) }
  }
}

const copyFormBinFromXML = async (params: { inputDir: string; formName: string; outputDir: string }): Promise<void> => {
  const { inputDir, formName, outputDir } = params
  const sourcePath = join(inputDir, formName, "Ext", "Form.bin")
  const targetPath = join(outputDir, "Формы", formName, "Form.bin")
  await copyExistingRawFile({ sourcePath, targetPath })
}

const copyFormHelpFilesFromXML = async (params: {
  inputDir: string
  formName: string
  outputDir: string
}): Promise<void> => {
  const { inputDir, formName, outputDir } = params
  await copyRawDirectoryFiles({
    sourceDir: join(inputDir, formName, "Ext", "Help", "_files"),
    targetDir: join(outputDir, "Формы", formName, "Справка", "_files"),
  })
}

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error && error.code === "ENOENT"

const getFormTypeFromMetadataXML = (metadataXML: string): string | undefined => {
  const parsedMetadata = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(metadataXML)
  return parsedMetadata.MetaDataObject.Form.Properties.FormType
}

function parseFormFromXML(params: {
  context: ConfigurationContextFromXML
  formXML: string | undefined
  metadataXML: string
}): ClientApplicationForm {
  const { context, formXML, metadataXML } = params

  const parsedForm =
    formXML !== undefined
      ? importContentFromXML<{ Form: ClientApplicationFormXML }>(formXML, { preserveXsiNil: true }).Form
      : {}
  const parsedMetadata = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(metadataXML)

  return prepareClientApplicationFormModelFromXML({
    context,
    formName: "",
    formXML: parsedForm,
    metadataXML: parsedMetadata.MetaDataObject,
  })
}

export function prepareClientApplicationFormModelFromXML(params: {
  context: ConfigurationContextFromXML
  formName: string
  formXML: ClientApplicationFormXML | undefined
  metadataXML: FormMetadataXML
}): ClientApplicationForm {
  if (params.formXML === undefined && params.metadataXML.Form.Properties.FormType !== "Ordinary") {
    throw new Error(`Не найден Form.xml для управляемой формы ${params.formName}`)
  }
  const model = importClientApplicationFormFromXML({
    context: params.context,
    xml: params.formXML ?? {},
    xmlMetadata: params.metadataXML,
  })
  if (params.formName) model.name = params.formName
  return model
}

const convertFormToYAML = async (params: {
  context: ConfigurationContext
  form: ClientApplicationForm
  formName: string
}): Promise<ReadFormFromXMLResult> => {
  const { context, form, formName } = params

  const { yaml: yamlObj, externalFiles } = exportClientApplicationFormToYAML(context, { ...form, name: formName })
  const yaml = yamlObj != null ? exportToYAML(yamlObj) : undefined

  return { yaml, externalFiles }
}
