import fs from "fs"
import { join } from "path"
import { ConfigurationContextFromXML, ExternalFileEntry } from "@nkdk/runtime"
import { parseXmlDocumentWithSaxes, type XmlElementNode } from "@nkdk/runtime"
import { exportToYAML } from "@nkdk/runtime"
import { copyFormItemExternalFilesFromXML } from "./externalItemFiles"
import { copyExistingRawFile, copyRawDirectoryFiles } from "./externalRawFiles"
import { importClientApplicationFormFromXMLToYAML } from "./fromXMLToYAML"
import { formTypeFromMetadataXML } from "./metadataXML"
import { childUid } from "@nkdk/runtime"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "@nkdk/runtime"

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
  const parsedMetadata = parseXmlDocumentWithSaxes(metadataXML).roots.find(node => node.name === "MetaDataObject")
  if (parsedMetadata === undefined) throw new Error(`Не найден MetaDataObject: ${metadataPath}`)

  const { formXML, hasFormBin } = await readFormBodyFromXML({ inputDir, formName, metadataXML: parsedMetadata })
  const collection = getConfigurationIndexCollectionContext(context)
  const formContext =
    collection === undefined
      ? context
      : withConfigurationIndexLogicalAddress(context, childUid(collection.logicalAddress, "Форма", formName))
  const parsedForm =
    formXML === undefined
      ? undefined
      : parseXmlDocumentWithSaxes(formXML, { preserveXsiNil: true }).roots.find(node => node.name === "Form")
  const direct = importClientApplicationFormFromXMLToYAML({
    context: formContext,
    formName,
    formXML: parsedForm,
    metadataXML: parsedMetadata,
  })
  const yaml = direct.yaml === undefined ? undefined : exportToYAML(direct.yaml)
  const externalFiles = direct.generatedFiles

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
  metadataXML: XmlElementNode
}): Promise<{ formXML: string | undefined; hasFormBin: boolean }> => {
  const { inputDir, formName, metadataXML } = params
  const formPath = join(inputDir, formName, "Ext", "Form.xml")
  const formBinPath = join(inputDir, formName, "Ext", "Form.bin")
  const isOrdinaryForm = formTypeFromMetadataXML(metadataXML) === "Ordinary"

  try {
    return { formXML: await fs.promises.readFile(formPath, "utf-8"), hasFormBin: fs.existsSync(formBinPath) }
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
