import fs from "fs"
import { basename, dirname, join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import type { HelpPropertyRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { xmlExport } from "~/xml/export/exporter"

/**
 * Генерирует Ext/Help.xml по списку .html-файлов в nkdk-директории справки
 * и копирует сами HTML-файлы в XML-сторону.
 */
export const syncHelpToXML = async (params: {
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const { nkdkDir, xmlDir } = params
  const rule = params.rule as HelpPropertyRule

  const nkdkHelpDir = join(nkdkDir, rule.nkdkDir)
  if (!fs.existsSync(nkdkHelpDir)) return

  const htmlFiles = await fs.promises.readdir(nkdkHelpDir)
  const langs = htmlFiles.filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, ""))
  if (langs.length === 0) return

  const helpXmlObj = {
    Help: {
      _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
      "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
      "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      _version: "2.20",
      Page: langs.length === 1 ? langs[0] : langs,
    },
  }
  const rawXmlPath = rule.xmlPath ?? rule.filePath
  const filePath = typeof rawXmlPath === "function" ? rawXmlPath({ name: params.name! }) : rawXmlPath
  const normalizedFilePath = stripObjectPrefix({ xmlDir, filePath, objectName: params.name })
  const helpXmlPath = join(xmlDir, normalizedFilePath)
  await fs.promises.mkdir(dirname(helpXmlPath), { recursive: true })
  await fs.promises.writeFile(helpXmlPath, xmlExport(helpXmlObj), "utf-8")
  params.xmlManifest?.addFile(helpXmlPath)

  const helpHtmlDir = normalizedFilePath.replace(/\.xml$/, "")
  for (const lang of langs) {
    const srcHtmlPath = join(nkdkHelpDir, `${lang}.html`)
    const dstHtmlPath = join(xmlDir, helpHtmlDir, `${lang}.html`)
    await fs.promises.mkdir(dirname(dstHtmlPath), { recursive: true })
    await fs.promises.copyFile(srcHtmlPath, dstHtmlPath)
    params.xmlManifest?.addFile(dstHtmlPath)
  }
}

registerTypeRule("Help", "syncExternalToXML", syncHelpToXML)

const stripObjectPrefix = (params: { xmlDir: string; filePath: string; objectName?: string }): string => {
  const { xmlDir, filePath, objectName } = params
  if (!objectName || basename(xmlDir) !== objectName) return filePath
  const prefix = `${objectName}/`
  return filePath.startsWith(prefix) ? filePath.slice(prefix.length) : filePath
}
