import fs from "fs"
import { dirname, join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import type {
  ModulePropertyRule,
  PropertyRule,
  TemplatePropertyRule,
} from "~/metadata/orchestration/property/types"

/**
 * Копирует внешний .bsl-файл (модуль или шаблон) из nkdk-директории объекта
 * в соответствующее место XML-директории.
 * При обходе дочерних коллекций (itemName) подставляет имя в функциональные пути.
 */
export const syncModuleToXML = async (params: {
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  itemName?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const { nkdkDir, xmlDir, itemName } = params
  const rule = params.rule as ModulePropertyRule | TemplatePropertyRule

  const { xmlPath: rawXmlPath, nkdkPath: rawNkdkPath } = rule
  const needsItemName = typeof rawXmlPath === "function" || typeof rawNkdkPath === "function"
  if (needsItemName && !itemName) return

  const xmlPath = typeof rawXmlPath === "function" ? rawXmlPath({ name: itemName! }) : rawXmlPath
  const nkdkPath = typeof rawNkdkPath === "function" ? rawNkdkPath({ name: itemName! }) : rawNkdkPath

  const srcPath = join(nkdkDir, nkdkPath)
  if (!fs.existsSync(srcPath)) return
  const dstPath = join(xmlDir, xmlPath)
  await fs.promises.mkdir(dirname(dstPath), { recursive: true })
  await fs.promises.copyFile(srcPath, dstPath)
  params.xmlManifest?.addFile(dstPath)
}

registerTypeRule("Module", "syncExternalToXML", syncModuleToXML)
registerTypeRule("Template", "syncExternalToXML", syncModuleToXML)
