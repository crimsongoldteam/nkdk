import fs from "fs"
import { dirname, join } from "path"
import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { SyncExternalToXMLFunction } from "~/metadata/orchestration/property/fn"
import type { ChildTemplateNamesPropertyRule } from "./types"

export const syncChildTemplateNamesToXML: SyncExternalToXMLFunction = async (params) => {
  const { nkdkDir, xmlDir, name, rule: rawRule, xmlManifest } = params
  const rule = rawRule as ChildTemplateNamesPropertyRule

  const templatesDir = join(nkdkDir, rule.folderName)
  if (!fs.existsSync(templatesDir)) return

  const entries = await fs.promises.readdir(templatesDir, { withFileTypes: true })
  const templateNames = entries.filter((e) => e.isDirectory()).map((e) => e.name)
  const templateOutputDir = join(xmlDir, name, "Templates")

  for (const templateName of templateNames) {
    await copyIfExists({
      src: join(templatesDir, templateName, "Template.xml"),
      dst: join(templateOutputDir, `${templateName}.xml`),
      xmlManifest,
    })
    await copyIfExists({
      src: join(templatesDir, templateName, "Template.txt"),
      dst: join(templateOutputDir, templateName, "Ext", "Template.txt"),
      xmlManifest,
    })
    await copyIfExists({
      src: join(templatesDir, templateName, "Template.bin"),
      dst: join(templateOutputDir, templateName, "Ext", "Template.bin"),
      xmlManifest,
    })
    await copyTemplateDirectoryToXML({
      srcDir: join(templatesDir, templateName),
      dstDir: join(templateOutputDir, templateName),
      xmlManifest,
    })
  }
}

async function copyIfExists(params: {
  src: string
  dst: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  const { src, dst, xmlManifest } = params
  if (!fs.existsSync(src)) return
  await fs.promises.mkdir(dirname(dst), { recursive: true })
  await fs.promises.copyFile(src, dst)
  xmlManifest?.addFile(dst)
}

async function copyTemplateDirectoryToXML(params: {
  srcDir: string
  dstDir: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  const { srcDir, dstDir, xmlManifest } = params
  if (!fs.existsSync(srcDir)) return

  const entries = await fs.promises.readdir(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === "Template.xml" || entry.name === "Template.txt" || entry.name === "Template.bin") continue

    await copyTemplateEntryToXML({
      src: join(srcDir, entry.name),
      dst: join(dstDir, entry.name),
      entry,
      xmlManifest,
    })
  }
}

async function copyTemplateEntryToXML(params: {
  src: string
  dst: string
  entry: fs.Dirent
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  const { src, dst, entry, xmlManifest } = params
  if (entry.isDirectory()) {
    await fs.promises.mkdir(dst, { recursive: true })
    const children = await fs.promises.readdir(src, { withFileTypes: true })
    for (const child of children) {
      await copyTemplateEntryToXML({
        src: join(src, child.name),
        dst: join(dst, child.name),
        entry: child,
        xmlManifest,
      })
    }
    return
  }

  if (!entry.isFile()) return

  await fs.promises.mkdir(dirname(dst), { recursive: true })
  await fs.promises.copyFile(src, dst)
  xmlManifest?.addFile(dst)
}

registerTypeRule("ChildTemplateNames", "syncExternalToXML", syncChildTemplateNamesToXML)
