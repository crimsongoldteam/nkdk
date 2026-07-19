import fs from "fs"
import { dirname, join } from "path"
import { registerTypeRule } from "../../orchestration"
import type { ModulePropertyRule, PropertyRule, TemplatePropertyRule } from "../../orchestration/property/types"

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

  if (rule.type === "Template") {
    await syncTemplateCompanionsFromXML({ xmlDir, nkdkDir, xmlPath, nkdkPath, objectName: params.name })
  }
}

registerTypeRule("Module", "syncExternalFromXML", syncModuleFromXML)
registerTypeRule("Template", "syncExternalFromXML", syncModuleFromXML)
registerTypeRule("Module", "xmlImportRoutes", describeModuleXmlImportRoutes)
registerTypeRule("Template", "xmlImportRoutes", describeModuleXmlImportRoutes)

function describeModuleXmlImportRoutes({ propertyRule }: { propertyRule?: PropertyRule }) {
  const rule = propertyRule as ModulePropertyRule | TemplatePropertyRule
  const xmlPath = importPathPattern(rule.xmlPath)
  const targetPath = importPathPattern(rule.nkdkPath)
  const source = { kind: "propertyType" as const, type: rule.type }
  const routes = [
    {
      kind: "externalFile" as const,
      xmlPattern: xmlPath,
      targetPattern: targetPath,
      assignmentTargetPattern: "",
      source,
    },
  ]
  if (xmlPath.toLowerCase().endsWith(".bsl") && targetPath.toLowerCase().endsWith(".bsl")) {
    routes.push({
      kind: "externalFile",
      xmlPattern: xmlPath.replace(/\.bsl$/i, ".bin"),
      targetPattern: targetPath.replace(/\.bsl$/i, ".bin"),
      assignmentTargetPattern: "",
      source,
    })
  }
  if (rule.type === "Template" && xmlPath.toLowerCase().endsWith(".xml") && targetPath.toLowerCase().endsWith(".xml")) {
    const xmlBase = xmlPath.replace(/\.xml$/i, "")
    const targetBase = targetPath.replace(/\.xml$/i, "")
    for (const extension of [".bin", ".txt"]) {
      routes.push({
        kind: "externalFile",
        xmlPattern: `${xmlBase}${extension}`,
        targetPattern: `${targetBase}${extension}`,
        assignmentTargetPattern: "",
        source,
      })
    }
    routes.push({
      kind: "externalFile",
      xmlPattern: `${xmlBase}/{relativePath...}`,
      targetPattern: `${targetBase}/{relativePath...}`,
      assignmentTargetPattern: "",
      source,
    })
  }
  return routes
}

function importPathPattern(value: string | ((params: { name: string; parentName?: string }) => string)): string {
  return typeof value === "string" ? value : value({ name: "{currentName}", parentName: "{parentName}" })
}

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

const syncTemplateCompanionsFromXML = async (params: {
  xmlDir: string
  nkdkDir: string
  xmlPath: string
  nkdkPath: string
  objectName?: string
}): Promise<void> => {
  const xmlBasePath = stripXmlExtension(params.xmlPath)
  const nkdkBasePath = stripXmlExtension(params.nkdkPath)
  if (!xmlBasePath || !nkdkBasePath) return

  for (const extension of [".bin", ".txt"]) {
    const srcPath = resolveSourcePath({
      xmlDir: params.xmlDir,
      xmlPath: `${xmlBasePath}${extension}`,
      objectName: params.objectName,
    })
    if (!fs.existsSync(srcPath)) continue

    const dstPath = join(params.nkdkDir, `${nkdkBasePath}${extension}`)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
  }

  const srcDir = resolveSourcePath({
    xmlDir: params.xmlDir,
    xmlPath: xmlBasePath,
    objectName: params.objectName,
  })
  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) return

  await copyDirectoryRecursive({ srcDir, dstDir: join(params.nkdkDir, nkdkBasePath) })
}

const copyDirectoryRecursive = async (params: { srcDir: string; dstDir: string }): Promise<void> => {
  const entries = await fs.promises.readdir(params.srcDir, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = join(params.srcDir, entry.name)
    const dstPath = join(params.dstDir, entry.name)
    if (entry.isDirectory()) {
      await copyDirectoryRecursive({ srcDir: srcPath, dstDir: dstPath })
      continue
    }
    if (!entry.isFile()) continue

    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
  }
}

const stripXmlExtension = (path: string): string | undefined =>
  path.endsWith(".xml") ? path.replace(/\.xml$/i, "") : undefined
