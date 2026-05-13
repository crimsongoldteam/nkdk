import fs from "fs"
import { dirname, join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import type { HelpPropertyRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { importContentFromXML } from "~/xml/import/importer"

/**
 * Читает Ext/Help.xml и копирует HTML-страницы каждого языка в nkdk-директорию объекта.
 */
export const syncHelpFromXML = async (params: {
  rule: PropertyRule
  xmlDir: string
  nkdkDir: string
  name?: string
}): Promise<void> => {
  const { xmlDir, nkdkDir } = params
  const rule = params.rule as HelpPropertyRule

  const rawXmlPath = rule.xmlPath ?? rule.filePath
  const filePath = typeof rawXmlPath === "function" ? rawXmlPath({ name: params.name! }) : rawXmlPath
  const resolvedFilePath = resolveHelpFilePath({ xmlDir, filePath, objectName: params.name })
  const helpXmlPath = join(xmlDir, resolvedFilePath)
  if (!fs.existsSync(helpXmlPath)) return

  const helpXmlContent = await fs.promises.readFile(helpXmlPath, "utf-8")
  const helpParsed = importContentFromXML<{ Help: { Page?: string | string[] } }>(helpXmlContent)
  const pages = helpParsed.Help?.Page
  const langs: string[] = pages === undefined ? [] : Array.isArray(pages) ? pages : [pages]

  const helpHtmlDir = resolvedFilePath.replace(/\.xml$/, "")
  for (const lang of langs) {
    const srcHtmlPath = join(xmlDir, helpHtmlDir, `${lang}.html`)
    if (!fs.existsSync(srcHtmlPath)) continue
    const dstHtmlPath = join(nkdkDir, rule.nkdkDir, `${lang}.html`)
    await fs.promises.mkdir(dirname(dstHtmlPath), { recursive: true })
    await fs.promises.copyFile(srcHtmlPath, dstHtmlPath)
  }
}

registerTypeRule("Help", "syncExternalFromXML", syncHelpFromXML)

const resolveHelpFilePath = (params: { xmlDir: string; filePath: string; objectName?: string }): string => {
  const directPath = join(params.xmlDir, params.filePath)
  if (fs.existsSync(directPath) || !params.objectName) return params.filePath

  const objectFilePath = join(params.objectName, params.filePath)
  return fs.existsSync(join(params.xmlDir, objectFilePath)) ? objectFilePath : params.filePath
}
