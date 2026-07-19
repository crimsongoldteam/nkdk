import fs from "fs"
import { basename, dirname, join } from "path"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { SyncExternalFromXMLFunction } from "../../orchestration/property/fn"
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
      src: join(templatesDir, templateName, "Ext", "Template.bin"),
      dst: join(templateOutputDir, "Template.bin"),
    })
    await copyDirectoryIfExists({
      src: join(templatesDir, templateName),
      dst: templateOutputDir,
    })
  }
}

async function copyIfExists(params: { src: string; dst: string }): Promise<void> {
  const { src, dst } = params
  if (!fs.existsSync(src)) return
  await fs.promises.mkdir(dirname(dst), { recursive: true })
  await fs.promises.copyFile(src, dst)
}

async function copyDirectoryIfExists(params: { src: string; dst: string }): Promise<void> {
  if (!fs.existsSync(params.src)) return
  await fs.promises.mkdir(params.dst, { recursive: true })
  await fs.promises.cp(params.src, params.dst, { recursive: true })
}

registerTypeRule("ChildTemplateNames", "syncExternalFromXML", syncChildTemplateNamesFromXML)
registerTypeRule("ChildTemplateNames", "xmlImportRoutes", ({ propertyRule }) => {
  const folderName = (propertyRule as ChildTemplateNamesPropertyRule | undefined)?.folderName ?? "Макеты"
  const assignmentTargetPattern = `${folderName}/{itemName}/Template.xml`
  return [
    {
      kind: "assignment",
      xmlPattern: "Templates/{itemName}.xml",
      targetPattern: assignmentTargetPattern,
      role: "fileItem",
      itemType: "Template",
      source: { kind: "propertyType", type: "ChildTemplateNames" },
    },
    ...(["txt", "bin"] as const).map((extension) => ({
      kind: "externalFile" as const,
      xmlPattern: `Templates/{itemName}/Ext/Template.${extension}`,
      targetPattern: `${folderName}/{itemName}/Template.${extension}`,
      assignmentTargetPattern,
      source: { kind: "propertyType" as const, type: "ChildTemplateNames" as const },
    })),
    {
      kind: "externalFile",
      xmlPattern: "Templates/{itemName}/{relativePath...}",
      targetPattern: `${folderName}/{itemName}/{relativePath...}`,
      assignmentTargetPattern,
      source: { kind: "propertyType", type: "ChildTemplateNames" },
    },
  ]
})
