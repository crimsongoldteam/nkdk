import fs from "fs"
import { basename, dirname, join } from "path"
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
  const altNkdkPath = alternateNkdkPath(nkdkPath)
  const altSrcPath = altNkdkPath === undefined ? undefined : join(nkdkDir, altNkdkPath)
  const found = existingPaths([srcPath, ...(altSrcPath ? [altSrcPath] : [])])

  if (found.length > 1) {
    throw new Error(`Module has both .bsl and .bin: ${nkdkPath}`)
  }

  if (found.length === 1) {
    const isBinary = found[0].toLowerCase().endsWith(".bin")
    const outputXmlPath = isBinary ? alternateModulePath(xmlPath) : xmlPath
    if (!outputXmlPath) throw new Error(`Module binary alternative requires .bsl xmlPath: ${xmlPath}`)
    const xmlRelativePath = stripObjectPrefix({ xmlDir, xmlPath: outputXmlPath, objectName: params.name })
    const dstPath = join(xmlDir, xmlRelativePath)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(found[0], dstPath)
    params.xmlManifest?.addFile(dstPath)
  }
}

registerTypeRule("Module", "syncExternalToXML", syncModuleToXML)
registerTypeRule("Template", "syncExternalToXML", syncModuleToXML)

const stripObjectPrefix = (params: { xmlDir: string; xmlPath: string; objectName?: string }): string => {
  const { xmlDir, xmlPath, objectName } = params
  if (!objectName || basename(xmlDir) !== objectName) return xmlPath
  const prefix = `${objectName}/`
  return xmlPath.startsWith(prefix) ? xmlPath.slice(prefix.length) : xmlPath
}

const alternateModulePath = (path: string): string | undefined =>
  path.endsWith(".bsl") ? path.replace(/\.bsl$/i, ".bin") : undefined

const alternateNkdkPath = (path: string): string | undefined =>
  path.endsWith(".bsl") ? path.replace(/\.bsl$/i, ".bin") : undefined

const existingPaths = (paths: string[]): string[] => paths.filter((path) => fs.existsSync(path))
