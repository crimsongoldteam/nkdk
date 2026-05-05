import fs from "fs"
import { dirname, join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import type {
  ModulePropertyRule,
  PropertyRule,
  TemplatePropertyRule,
} from "~/metadata/orchestration/property/types"

/**
 * Копирует внешний .bsl-файл (модуль или шаблон) из XML-директории объекта
 * в соответствующее место nkdk-директории.
 * При обходе дочерних коллекций (itemName) подставляет имя в функциональные пути.
 */
export const syncModuleFromXML = async (params: {
  rule: PropertyRule
  xmlDir: string
  nkdkDir: string
  itemName?: string
}): Promise<void> => {
  const { xmlDir, nkdkDir, itemName } = params
  const rule = params.rule as ModulePropertyRule | TemplatePropertyRule

  const { xmlPath: rawXmlPath, nkdkPath: rawNkdkPath } = rule
  const needsItemName = typeof rawXmlPath === "function" || typeof rawNkdkPath === "function"
  if (needsItemName && !itemName) return

  const xmlPath = typeof rawXmlPath === "function" ? rawXmlPath({ name: itemName! }) : rawXmlPath
  const nkdkPath = typeof rawNkdkPath === "function" ? rawNkdkPath({ name: itemName! }) : rawNkdkPath

  const srcPath = join(xmlDir, xmlPath)
  if (!fs.existsSync(srcPath)) return
  const dstPath = join(nkdkDir, nkdkPath)
  await fs.promises.mkdir(dirname(dstPath), { recursive: true })
  await fs.promises.copyFile(srcPath, dstPath)
}

registerTypeRule("Module", "syncExternalFromXML", syncModuleFromXML)
registerTypeRule("Template", "syncExternalFromXML", syncModuleFromXML)
