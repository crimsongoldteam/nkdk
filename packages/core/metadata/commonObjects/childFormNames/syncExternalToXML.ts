import fs from "fs"
import { dirname, join, posix } from "path"
import { syncFormToXML } from "~/metadata/forms/clientApplicationForm/syncToXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { SyncExternalToXMLFunction } from "~/metadata/orchestration/property/fn"
import { xmlExport } from "~/xml/export/exporter"
import type { ChildFormNamesPropertyRule } from "./types"

/**
 * Сканирует папку форм объекта (`<nkdkDir>/<folderName>`) и для каждой подпапки
 * с `Форма.yaml` вызывает `syncFormToXML`. Формы обрабатываются последовательно
 * внутри объекта.
 */
export const syncChildFormNamesToXML: SyncExternalToXMLFunction = async (params) => {
  const { context, rule: rawRule, nkdkDir, xmlDir, name, referenceDir, referenceName, xmlManifest } = params
  const rule = rawRule as ChildFormNamesPropertyRule

  const formsDir = join(nkdkDir, rule.folderName)
  if (!fs.existsSync(formsDir)) return

  const entries = await fs.promises.readdir(formsDir, { withFileTypes: true })
  const formNames = entries
    .filter((e) => e.isDirectory())
    .filter((e) => {
      const yamlPath = join(formsDir, e.name, "Форма.yaml")
      return fs.existsSync(yamlPath)
    })
    .map((e) => e.name)

  const formOutputDir = join(xmlDir, name)
  const formReferenceDir = referenceDir ? join(referenceDir, referenceName ?? name, "Forms") : undefined

  for (const formName of formNames) {
    await syncFormToXML({
      context,
      inputDir: nkdkDir,
      formName,
      outputDir: formOutputDir,
      referenceDir: formReferenceDir,
      currentXMLPath: buildChildFormCurrentXMLPath({ xmlDir, name, formName }),
      xmlManifest,
    })
    await copyFormModuleToXML({ nkdkDir, formOutputDir, formName, xmlManifest })
    await copyFormHelpToXML({ nkdkDir, formOutputDir, formName, xmlManifest })
  }
}

export const buildChildFormCurrentXMLPath = (params: {
  xmlDir: string
  name: string
  formName: string
}): string => {
  const xmlDirName = getLastPathSegment(params.xmlDir)
  return posix.join(xmlDirName, params.name, "Forms", params.formName, "Ext", "Form.xml")
}

const getLastPathSegment = (value: string): string => {
  const segments = value.split(/[\\/]+/).filter((segment) => segment.length > 0)
  return segments.length > 0 ? segments[segments.length - 1] : value
}

async function copyFormModuleToXML(params: {
  nkdkDir: string
  formOutputDir: string
  formName: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> {
  const { nkdkDir, formOutputDir, formName, xmlManifest } = params
  const srcPath = join(nkdkDir, "Формы", formName, "Модуль.bsl")
  if (!fs.existsSync(srcPath)) return

  const dstPath = join(formOutputDir, "Forms", formName, "Ext", "Form", "Module.bsl")
  await fs.promises.mkdir(dirname(dstPath), { recursive: true })
  await fs.promises.copyFile(srcPath, dstPath)
  xmlManifest?.addFile(dstPath)
}

async function copyFormHelpToXML(params: {
  nkdkDir: string
  formOutputDir: string
  formName: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> {
  const { nkdkDir, formOutputDir, formName, xmlManifest } = params
  const srcDir = join(nkdkDir, "Формы", formName, "Справка")
  if (!fs.existsSync(srcDir)) return

  const htmlFiles = (await fs.promises.readdir(srcDir)).filter((file) => file.endsWith(".html"))
  if (htmlFiles.length === 0) return

  const helpXmlPath = join(formOutputDir, "Forms", formName, "Ext", "Help.xml")
  await fs.promises.mkdir(dirname(helpXmlPath), { recursive: true })
  const langs = htmlFiles.map((file) => file.replace(/\.html$/, ""))
  const helpXmlObj = {
    Help: {
      _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
      "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
      "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      _version: "2.20",
      Page: langs.length === 1 ? langs[0] : langs,
    },
  }
  await fs.promises.writeFile(helpXmlPath, xmlExport(helpXmlObj), "utf-8")
  xmlManifest?.addFile(helpXmlPath)

  for (const file of htmlFiles) {
    const dstPath = join(formOutputDir, "Forms", formName, "Ext", "Help", file)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(join(srcDir, file), dstPath)
    xmlManifest?.addFile(dstPath)
  }
}

registerTypeRule("ChildFormNames", "syncExternalToXML", syncChildFormNamesToXML)
