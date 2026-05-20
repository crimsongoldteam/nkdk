import fs from "fs"
import { dirname, join } from "path"
import { syncExplicitExternalFilesFromXML } from "~/metadata/commonObjects/externalFiles/sync"
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
  name?: string
  itemName?: string
}): Promise<void> => {
  const { xmlDir, nkdkDir, itemName } = params
  const rule = params.rule as ModulePropertyRule | TemplatePropertyRule

  const { xmlPath: rawXmlPath, nkdkPath: rawNkdkPath } = rule
  const name = itemName ?? params.name
  const needsName = typeof rawXmlPath === "function" || typeof rawNkdkPath === "function"
  if (needsName && !name) return

  const pathParams = { name: name!, parentName: params.name }
  const xmlPath = typeof rawXmlPath === "function" ? rawXmlPath(pathParams) : rawXmlPath
  const nkdkPath = typeof rawNkdkPath === "function" ? rawNkdkPath(pathParams) : rawNkdkPath

  const srcPath = resolveSourcePath({ xmlDir, xmlPath, objectName: params.name })
  if (fs.existsSync(srcPath)) {
    const dstPath = join(nkdkDir, nkdkPath)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
  }
  await syncExplicitExternalFilesFromXML({
    rules: rule.externalFiles,
    xmlDir: resolveSourceRoot({ xmlDir, xmlPath, objectName: params.name }),
    nkdkDir,
    pathParams,
  })
}

registerTypeRule("Module", "syncExternalFromXML", syncModuleFromXML)
registerTypeRule("Template", "syncExternalFromXML", syncModuleFromXML)

const resolveSourcePath = (params: { xmlDir: string; xmlPath: string; objectName?: string }): string => {
  const directPath = join(params.xmlDir, params.xmlPath)
  if (fs.existsSync(directPath)) return directPath
  if (!params.objectName) return directPath

  const objectPath = join(params.xmlDir, params.objectName, params.xmlPath)
  return fs.existsSync(objectPath) ? objectPath : directPath
}

const resolveSourceRoot = (params: { xmlDir: string; xmlPath: string; objectName?: string }): string => {
  const directPath = join(params.xmlDir, params.xmlPath)
  if (fs.existsSync(directPath)) return params.xmlDir
  if (!params.objectName) return params.xmlDir

  const objectRoot = join(params.xmlDir, params.objectName)
  const objectPath = join(objectRoot, params.xmlPath)
  return fs.existsSync(objectPath) || fs.existsSync(objectRoot) ? objectRoot : params.xmlDir
}
