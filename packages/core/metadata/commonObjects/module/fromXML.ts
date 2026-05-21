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
  const altXmlPath = alternateModulePath(xmlPath)
  const altSrcPath =
    altXmlPath === undefined ? undefined : resolveSourcePath({ xmlDir, xmlPath: altXmlPath, objectName: params.name })
  const found = existingPaths([srcPath, ...(altSrcPath ? [altSrcPath] : [])])

  if (found.length > 1) {
    throw new Error(`Module has both .bsl and .bin: ${xmlPath}`)
  }

  if (found.length === 1) {
    const isBinary = found[0].toLowerCase().endsWith(".bin")
    const dstRelativePath = isBinary ? alternateNkdkPath(nkdkPath) : nkdkPath
    if (!dstRelativePath) throw new Error(`Module binary alternative requires .bsl nkdkPath: ${nkdkPath}`)
    const dstPath = join(nkdkDir, dstRelativePath)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(found[0], dstPath)
  }
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

const alternateModulePath = (path: string): string | undefined =>
  path.endsWith(".bsl") ? path.replace(/\.bsl$/i, ".bin") : undefined

const alternateNkdkPath = (path: string): string | undefined =>
  path.endsWith(".bsl") ? path.replace(/\.bsl$/i, ".bin") : undefined

const existingPaths = (paths: string[]): string[] => paths.filter((path) => fs.existsSync(path))
