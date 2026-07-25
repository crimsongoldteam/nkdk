import fs from "fs"
import { basename, dirname, join } from "path"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { registerTypeRule } from "../../orchestration"
import { recordDerivedExternalMetadata } from "../../orchestration/externalMetadata/record"
import type { HelpPropertyRule, PropertyRule } from "../../orchestration/property/types"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import { xmlExport } from "../../../xml/export/exporter"
import { registerMetadataXmlPrepareCapability } from "../../resourceTopology/capabilities"

export function prepareHelpXML(params: {
  rule: PropertyRule
  nkdkDir: string
}): Record<string, unknown> | undefined {
  const rule = params.rule as HelpPropertyRule
  const nkdkHelpDir = join(params.nkdkDir, rule.nkdkDir)
  if (!fs.existsSync(nkdkHelpDir)) return undefined

  const langs = fs
    .readdirSync(nkdkHelpDir)
    .filter((file) => file.endsWith(".html"))
    .map((file) => file.replace(/\.html$/, ""))
    .sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
  if (langs.length === 0) return undefined

  return {
    Help: {
      _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
      "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
      "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      _version: "2.20",
      Page: langs.length === 1 ? langs[0] : langs,
    },
  }
}

/**
 * Генерирует Ext/Help.xml по списку .html-файлов в nkdk-директории справки
 * и копирует сами HTML-файлы в XML-сторону.
 */
export const syncHelpToXML = async (params: {
  context?: ConfigurationContextWithExportToXML
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name?: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  const { nkdkDir, xmlDir } = params
  const rule = params.rule as HelpPropertyRule

  const nkdkHelpDir = join(nkdkDir, rule.nkdkDir)
  const helpXmlObj = prepareHelpXML({ rule, nkdkDir })
  if (helpXmlObj === undefined) return
  const page = (helpXmlObj.Help as { Page: string | string[] }).Page
  const langs = Array.isArray(page) ? page : [page]
  const rawXmlPath = rule.xmlPath ?? rule.filePath
  const filePath = typeof rawXmlPath === "function" ? rawXmlPath({ name: params.name! }) : rawXmlPath
  const normalizedFilePath = stripObjectPrefix({ xmlDir, filePath, objectName: params.name })
  const helpXmlPath = join(xmlDir, normalizedFilePath)
  await fs.promises.mkdir(dirname(helpXmlPath), { recursive: true })
  await fs.promises.writeFile(helpXmlPath, xmlExport(helpXmlObj), "utf-8")
  params.xmlManifest?.addFile(helpXmlPath)
  if (params.context) recordDerivedExternalMetadata({ context: params.context, rule, name: undefined })

  const helpHtmlDir = normalizedFilePath.replace(/\.xml$/, "")
  for (const lang of langs) {
    const srcHtmlPath = join(nkdkHelpDir, `${lang}.html`)
    const dstHtmlPath = join(xmlDir, helpHtmlDir, `${lang}.html`)
    await fs.promises.mkdir(dirname(dstHtmlPath), { recursive: true })
    await fs.promises.copyFile(srcHtmlPath, dstHtmlPath)
    params.xmlManifest?.addFile(dstHtmlPath)
  }

  await copyDirectoryFilesOnly(join(nkdkHelpDir, "_files"), join(xmlDir, helpHtmlDir, "_files"), params.xmlManifest)
}

registerTypeRule("Help", "syncExternalToXML", syncHelpToXML)

registerMetadataXmlPrepareCapability({
  id: "Help",
  run: ({ assignment, preparedYamlFile, outputs }) => {
    const output = outputs.find((candidate) => candidate.role === "property")
    const propertyKey = output?.propertyName
    if (output === undefined || propertyKey === undefined) return []
    const propertyRule = assignment.itemRule.properties[propertyKey]
    if (propertyRule === undefined) return []
    const xml = prepareHelpXML({
      rule: propertyRule,
      nkdkDir: dirname(preparedYamlFile.filePath),
    })
    if (xml === undefined) return []
    return [
      {
        declarationId: output.declarationId,
        targetXmlPath: output.targetXmlPath,
        xml,
        deferred: [],
        rootRule: assignment.itemRule,
      },
    ]
  },
})

const copyDirectoryFilesOnly = async (
  srcDir: string,
  dstDir: string,
  xmlManifest?: XmlWriteManifest
): Promise<void> => {
  if (!fs.existsSync(srcDir)) return
  const srcStat = await fs.promises.lstat(srcDir)
  if (!srcStat.isDirectory()) return

  for (const entry of await fs.promises.readdir(srcDir, { withFileTypes: true })) {
    const srcPath = join(srcDir, entry.name)
    const dstPath = join(dstDir, entry.name)
    if (entry.isDirectory()) {
      await copyDirectoryFilesOnly(srcPath, dstPath, xmlManifest)
    } else if (entry.isFile()) {
      await fs.promises.mkdir(dirname(dstPath), { recursive: true })
      await fs.promises.copyFile(srcPath, dstPath)
      xmlManifest?.addFile(dstPath)
    }
  }
}

const stripObjectPrefix = (params: { xmlDir: string; filePath: string; objectName?: string }): string => {
  const { xmlDir, filePath, objectName } = params
  if (!objectName || basename(xmlDir) !== objectName) return filePath
  const prefix = `${objectName}/`
  return filePath.startsWith(prefix) ? filePath.slice(prefix.length) : filePath
}
