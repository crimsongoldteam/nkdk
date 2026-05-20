import fs from "fs"
import { basename, dirname, join } from "path"
import { syncExplicitExternalFilesToXML } from "~/metadata/commonObjects/externalFiles/sync"
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
  name?: string
  itemName?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const { nkdkDir, xmlDir, itemName } = params
  const rule = params.rule as ModulePropertyRule | TemplatePropertyRule

  const { xmlPath: rawXmlPath, nkdkPath: rawNkdkPath } = rule
  const name = itemName ?? params.name
  const needsName = typeof rawXmlPath === "function" || typeof rawNkdkPath === "function"
  if (needsName && !name) return

  const pathParams = { name: name!, parentName: params.name }
  const xmlPath = typeof rawXmlPath === "function" ? rawXmlPath(pathParams) : rawXmlPath
  const nkdkPath = typeof rawNkdkPath === "function" ? rawNkdkPath(pathParams) : rawNkdkPath

  const srcPath = join(nkdkDir, nkdkPath)
  const xmlRelativePath = stripObjectPrefix({ xmlDir, xmlPath, objectName: params.name })
  const dstPath = join(xmlDir, xmlRelativePath)
  if (fs.existsSync(srcPath)) {
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
    params.xmlManifest?.addFile(dstPath)
  }
  await syncExplicitExternalFilesToXML({
    rules: rule.externalFiles,
    nkdkDir,
    xmlDir: resolveExternalOutputRoot({ xmlDir, xmlPath, objectName: params.name }),
    pathParams,
    xmlManifest: params.xmlManifest,
  })
}

registerTypeRule("Module", "syncExternalToXML", syncModuleToXML)
registerTypeRule("Template", "syncExternalToXML", syncModuleToXML)

const stripObjectPrefix = (params: { xmlDir: string; xmlPath: string; objectName?: string }): string => {
  const { xmlDir, xmlPath, objectName } = params
  if (!objectName || basename(xmlDir) !== objectName) return xmlPath
  const prefix = `${objectName}/`
  return xmlPath.startsWith(prefix) ? xmlPath.slice(prefix.length) : xmlPath
}

const resolveExternalOutputRoot = (params: { xmlDir: string; xmlPath: string; objectName?: string }): string => {
  if (!params.objectName || basename(params.xmlDir) === params.objectName) return params.xmlDir

  const prefix = `${params.objectName}/`
  return params.xmlPath.startsWith(prefix) ? params.xmlDir : join(params.xmlDir, params.objectName)
}
