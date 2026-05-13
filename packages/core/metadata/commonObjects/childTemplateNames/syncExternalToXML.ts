import fs from "fs"
import { dirname, join } from "path"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
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
  }
}

async function copyIfExists(params: {
  src: string
  dst: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> {
  const { src, dst, xmlManifest } = params
  if (!fs.existsSync(src)) return
  await fs.promises.mkdir(dirname(dst), { recursive: true })
  await fs.promises.copyFile(src, dst)
  xmlManifest?.addFile(dst)
}

registerTypeRule("ChildTemplateNames", "syncExternalToXML", syncChildTemplateNamesToXML)
