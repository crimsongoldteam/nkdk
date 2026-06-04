import fs from "fs"
import { basename, dirname, join } from "path"
import { convertFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { SyncExternalFromXMLFunction } from "~/metadata/orchestration/property/fn"
import { importContentFromXML } from "~/xml/import/importer"

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
