import fs from "fs"
import { dirname, join } from "path"
import { registerTypeRule } from "../../orchestration"
import type { HelpPropertyRule, PropertyRule } from "../../orchestration/property/types"
import { importContentFromXML } from "../../../xml/import/importer"

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

  await copyDirectoryFilesOnly(join(xmlDir, helpHtmlDir, "_files"), join(nkdkDir, rule.nkdkDir, "_files"))
}

registerTypeRule("Help", "syncExternalFromXML", syncHelpFromXML)

const copyDirectoryFilesOnly = async (srcDir: string, dstDir: string): Promise<void> => {
  if (!fs.existsSync(srcDir)) return
  const srcStat = await fs.promises.lstat(srcDir)
  if (!srcStat.isDirectory()) return

  for (const entry of await fs.promises.readdir(srcDir, { withFileTypes: true })) {
    const srcPath = join(srcDir, entry.name)
    const dstPath = join(dstDir, entry.name)
    if (entry.isDirectory()) {
      await copyDirectoryFilesOnly(srcPath, dstPath)
    } else if (entry.isFile()) {
      await fs.promises.mkdir(dirname(dstPath), { recursive: true })
      await fs.promises.copyFile(srcPath, dstPath)
    }
  }
}

const resolveHelpFilePath = (params: { xmlDir: string; filePath: string; objectName?: string }): string => {
  const directPath = join(params.xmlDir, params.filePath)
  if (fs.existsSync(directPath) || !params.objectName) return params.filePath

  const objectFilePath = join(params.objectName, params.filePath)
  return fs.existsSync(join(params.xmlDir, objectFilePath)) ? objectFilePath : params.filePath
}
