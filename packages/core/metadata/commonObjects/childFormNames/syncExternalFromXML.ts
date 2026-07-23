import fs from "fs"
import { basename, dirname, join } from "path"
import { convertFormFromXML } from "../../forms/clientApplicationForm/convertFromXML"
import { describeFormItemXmlImportRoutes } from "../../forms/clientApplicationForm/externalItemFiles"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { SyncExternalFromXMLFunction } from "../../orchestration/property/fn"
import type { ChildFormNamesPropertyRule } from "./types"
import { importContentFromXML } from "../../../xml/import/importer"

/**
 * Сканирует `<xmlDir>/<name>/Forms/*.xml` и для каждого вызывает `convertFormFromXML`.
 * Если `name` пустой, `xmlDir` уже указывает на текущий объект.
 * Формы обрабатываются последовательно внутри объекта.
 */
export const syncChildFormNamesFromXML: SyncExternalFromXMLFunction = async (params) => {
  const { context, xmlDir, nkdkDir, name } = params

  const formsDir = name === "" ? join(xmlDir, "Forms") : join(xmlDir, name, "Forms")
  if (!fs.existsSync(formsDir)) return

  const entries = await fs.promises.readdir(formsDir, { withFileTypes: true })
  const formNames = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))
    .map((e) => basename(e.name, ".xml"))

  for (const formName of formNames) {
    await convertFormFromXML({
      context,
      inputDir: formsDir,
      formName,
      outputDir: nkdkDir,
    })
    await copyFormModuleFromXML({ formsDir, nkdkDir, formName })
    await copyFormHelpFromXML({ formsDir, nkdkDir, formName })
  }
}

async function copyFormModuleFromXML(params: { formsDir: string; nkdkDir: string; formName: string }): Promise<void> {
  const { formsDir, nkdkDir, formName } = params
  const srcPath = join(formsDir, formName, "Ext", "Form", "Module.bsl")
  if (!fs.existsSync(srcPath)) return

  const dstPath = join(nkdkDir, "Формы", formName, "Модуль.bsl")
  await fs.promises.mkdir(dirname(dstPath), { recursive: true })
  await fs.promises.copyFile(srcPath, dstPath)
}

async function copyFormHelpFromXML(params: { formsDir: string; nkdkDir: string; formName: string }): Promise<void> {
  const { formsDir, nkdkDir, formName } = params
  const helpXmlPath = join(formsDir, formName, "Ext", "Help.xml")
  if (!fs.existsSync(helpXmlPath)) return

  const helpXmlContent = await fs.promises.readFile(helpXmlPath, "utf-8")
  const helpParsed = importContentFromXML<{ Help: { Page?: string | string[] } }>(helpXmlContent)
  const pages = helpParsed.Help?.Page
  const langs: string[] = pages === undefined ? [] : Array.isArray(pages) ? pages : [pages]

  const helpDir = join(formsDir, formName, "Ext", "Help")
  if (!fs.existsSync(helpDir)) return

  for (const lang of langs) {
    const file = `${lang}.html`
    const srcPath = join(helpDir, file)
    if (!fs.existsSync(srcPath)) continue
    const dstPath = join(nkdkDir, "Формы", formName, "Справка", file)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
  }
}

registerTypeRule("ChildFormNames", "syncExternalFromXML", syncChildFormNamesFromXML)
registerTypeRule("ChildFormNames", "xmlImportRoutes", ({ propertyRule }) => {
  const folderName = (propertyRule as ChildFormNamesPropertyRule | undefined)?.folderName ?? "Формы"
  const assignmentTargetPattern = `${folderName}/{itemName}/Форма.yaml`
  return [
    {
      kind: "assignment",
      xmlPattern: "Forms/{itemName}.xml",
      targetPattern: assignmentTargetPattern,
      role: "fileItem",
      itemType: "ClientApplicationForm",
      source: { kind: "propertyType", type: "ChildFormNames" },
    },
    {
      kind: "assignment",
      xmlPattern: "Forms/{itemName}/Ext/Form.xml",
      targetPattern: assignmentTargetPattern,
      role: "fileItem",
      inputRole: "body",
      itemType: "ClientApplicationForm",
      source: { kind: "propertyType", type: "ChildFormNames" },
    },
    {
      kind: "externalFile",
      xmlPattern: "Forms/{itemName}/Ext/Form/Module.bsl",
      targetPattern: `${folderName}/{itemName}/Модуль.bsl`,
      assignmentTargetPattern,
      source: { kind: "propertyType", type: "ChildFormNames" },
    },
    {
      kind: "assignment",
      xmlPattern: "Forms/{itemName}/Ext/Help.xml",
      targetPattern: assignmentTargetPattern,
      role: "fileItem",
      inputRole: "property",
      itemType: "ClientApplicationForm",
      source: { kind: "propertyType", type: "ChildFormNames" },
    },
    {
      kind: "externalFile",
      xmlPattern: "Forms/{itemName}/Ext/Help/{relativePath...}",
      targetPattern: `${folderName}/{itemName}/Справка/{relativePath...}`,
      assignmentTargetPattern,
      selection: {
        manifestPattern: "Forms/{itemName}/Ext/Help.xml",
        listPath: ["Help", "Page"],
        candidateParameter: "relativePath",
        candidateSuffix: ".html",
        alwaysIncludePrefixes: ["_files/"],
      },
      source: { kind: "propertyType", type: "ChildFormNames" },
    },
    ...describeFormItemXmlImportRoutes({
      xmlFormDirPattern: "Forms/{itemName}/Ext",
      targetFormDirPattern: `${folderName}/{itemName}`,
      assignmentTargetPattern,
    }),
    {
      kind: "externalFile",
      xmlPattern: "Forms/{itemName}/Ext/{relativePath...}",
      targetPattern: `${folderName}/{itemName}/{relativePath...}`,
      assignmentTargetPattern,
      fallback: true,
      source: { kind: "propertyType", type: "ChildFormNames" },
    },
  ]
})
