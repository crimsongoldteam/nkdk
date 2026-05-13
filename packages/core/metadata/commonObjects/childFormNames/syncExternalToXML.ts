import fs from "fs"
import { dirname, join } from "path"
import { syncFormToXML } from "~/metadata/forms/clientApplicationForm/syncToXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { SyncExternalToXMLFunction } from "~/metadata/orchestration/property/fn"
import type { ChildFormNamesPropertyRule } from "./types"

/**
 * Сканирует папку форм объекта (`<nkdkDir>/<folderName>`) и для каждой подпапки
 * с `Форма.yaml` + `Форма.nkdk` вызывает `syncFormToXML`. Формы обрабатываются
 * последовательно внутри объекта.
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
      const nkdkPath = join(formsDir, e.name, "Форма.nkdk")
      return fs.existsSync(yamlPath) && fs.existsSync(nkdkPath)
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
      xmlManifest,
    })
    await copyFormModuleToXML({ nkdkDir, formOutputDir, formName, xmlManifest })
  }
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

registerTypeRule("ChildFormNames", "syncExternalToXML", syncChildFormNamesToXML)
