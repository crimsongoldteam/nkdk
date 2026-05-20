import fs from "fs"
import { basename, dirname, join } from "path"
import { syncExplicitExternalFilesFromXML } from "~/metadata/commonObjects/externalFiles/sync"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { SyncExternalFromXMLFunction } from "~/metadata/orchestration/property/fn"
import { externalTemplateFiles } from "./externalFiles"
import type { ChildTemplateNamesPropertyRule } from "./types"

export const syncChildTemplateNamesFromXML: SyncExternalFromXMLFunction = async (params) => {
  const { xmlDir, nkdkDir, name, rule: rawRule } = params
  const rule = rawRule as ChildTemplateNamesPropertyRule

  const templatesDir = join(xmlDir, name, "Templates")
  if (!fs.existsSync(templatesDir)) return

  const entries = await fs.promises.readdir(templatesDir, { withFileTypes: true })
  const templateNames = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))
    .map((e) => basename(e.name, ".xml"))

  for (const templateName of templateNames) {
    const templateOutputDir = join(nkdkDir, rule.folderName, templateName)
    await copyIfExists({
      src: join(templatesDir, `${templateName}.xml`),
      dst: join(templateOutputDir, "Template.xml"),
    })
    await copyIfExists({
      src: join(templatesDir, templateName, "Ext", "Template.txt"),
      dst: join(templateOutputDir, "Template.txt"),
    })
    await copyIfExists({
      src: join(templatesDir, templateName, "Ext", "Template.xml"),
      dst: join(templateOutputDir, "Ext", "Template.xml"),
    })
    await syncExplicitExternalFilesFromXML({
      rules: externalTemplateFiles,
      xmlDir: templatesDir,
      nkdkDir: templateOutputDir,
      pathParams: { name: templateName, parentName: name },
    })
  }
}

async function copyIfExists(params: { src: string; dst: string }): Promise<void> {
  const { src, dst } = params
  if (!fs.existsSync(src)) return
  await fs.promises.mkdir(dirname(dst), { recursive: true })
  await fs.promises.copyFile(src, dst)
}

registerTypeRule("ChildTemplateNames", "syncExternalFromXML", syncChildTemplateNamesFromXML)
