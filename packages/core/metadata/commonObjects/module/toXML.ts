import fs from "fs"
import { basename, dirname, join } from "path"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { registerTypeRule } from "../../orchestration"
import { recordDerivedExternalMetadata } from "../../orchestration/externalMetadata/record"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import type { ModulePropertyRule, PropertyRule, TemplatePropertyRule } from "../../orchestration/property/types"

/**
 * Копирует внешний .bsl-файл (модуль или шаблон) из nkdk-директории объекта
 * в соответствующее место XML-директории.
 * При обходе дочерних коллекций (itemName) подставляет имя в функциональные пути.
 */
export const syncModuleToXML = async (params: {
  context?: ConfigurationContextWithExportToXML
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name?: string
  itemName?: string
  xmlManifest?: XmlWriteManifest
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
    if (params.context) recordDerivedExternalMetadata({ context: params.context, rule, name: undefined })
  }

  if (rule.type === "Template") {
    await syncTemplateCompanionsToXML({
      nkdkDir,
      xmlDir,
      nkdkPath,
      xmlPath,
      objectName: params.name,
      xmlManifest: params.xmlManifest,
    })
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

const syncTemplateCompanionsToXML = async (params: {
  nkdkDir: string
  xmlDir: string
  nkdkPath: string
  xmlPath: string
  objectName?: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  const nkdkBasePath = stripXmlExtension(params.nkdkPath)
  const xmlBasePath = stripXmlExtension(params.xmlPath)
  if (!nkdkBasePath || !xmlBasePath) return

  for (const extension of [".bin", ".txt"]) {
    const srcPath = join(params.nkdkDir, `${nkdkBasePath}${extension}`)
    if (!fs.existsSync(srcPath)) continue

    const xmlRelativePath = stripObjectPrefix({
      xmlDir: params.xmlDir,
      xmlPath: `${xmlBasePath}${extension}`,
      objectName: params.objectName,
    })
    const dstPath = join(params.xmlDir, xmlRelativePath)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
    params.xmlManifest?.addFile(dstPath)
  }

  const srcDir = join(params.nkdkDir, nkdkBasePath)
  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) return

  const xmlRelativeDir = stripObjectPrefix({
    xmlDir: params.xmlDir,
    xmlPath: xmlBasePath,
    objectName: params.objectName,
  })
  await copyDirectoryRecursive({ srcDir, dstDir: join(params.xmlDir, xmlRelativeDir), xmlManifest: params.xmlManifest })
}

const copyDirectoryRecursive = async (params: {
  srcDir: string
  dstDir: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  const entries = await fs.promises.readdir(params.srcDir, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = join(params.srcDir, entry.name)
    const dstPath = join(params.dstDir, entry.name)
    if (entry.isDirectory()) {
      await copyDirectoryRecursive({ srcDir: srcPath, dstDir: dstPath, xmlManifest: params.xmlManifest })
      continue
    }
    if (!entry.isFile()) continue

    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
    params.xmlManifest?.addFile(dstPath)
  }
}

const stripXmlExtension = (path: string): string | undefined =>
  path.endsWith(".xml") ? path.replace(/\.xml$/i, "") : undefined
