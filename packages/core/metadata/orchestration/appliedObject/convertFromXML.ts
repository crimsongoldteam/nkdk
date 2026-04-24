import fs from "fs"
import { join, dirname } from "path"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { exportMetadataItemToYAML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import type { MetadataItemRule, ModulePropertyRule, PropertyRule, TemplatePropertyRule } from "~/metadata/orchestration/property/types"
import { externalFileEnvelopes } from "~/metadata/commonObjects/predifined/rules"
import { importContentFromXML } from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"

const PROPERTIES_YAML = "Свойства.yaml"

export const convertAppliedObjectFromXML = async (params: {
  rule: MetadataItemRule
  context: ConfigurationContextFromXML
  inputDir: string
  name: string
  outputDir: string
}): Promise<void> => {
  const { rule, context, inputDir, name, outputDir } = params

  const inputPath = join(inputDir, `${name}.xml`)
  const xmlContent = await fs.promises.readFile(inputPath, "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(xmlContent)
  const model = importMetadataItemFromXML({ context, xml: parsed.MetaDataObject, rule })

  if (!model) return

  // Читаем внешние файлы для свойств с filePath
  for (const [key, propRule] of Object.entries(rule.properties)) {
    if (propRule.filePath === undefined) continue
    const envelope = externalFileEnvelopes[propRule.type]
    if (!envelope) continue
    const extFilePath = join(inputDir, propRule.filePath)
    if (!fs.existsSync(extFilePath)) continue
    const extContent = await fs.promises.readFile(extFilePath, "utf-8")
    const extParsed = importContentFromXML<Record<string, unknown>>(extContent)
    const containerContent = extParsed[envelope.container]
    const value = importPropertyFromXML({ context, rule: propRule as PropertyRule, value: containerContent, name: key })
    if (value !== undefined) (model as Record<string, unknown>)[key] = value
  }

  // Копируем BSL-файлы для свойств типа Module/Template
  for (const [_key, propRule] of Object.entries(rule.properties)) {
    if (propRule.type !== "Module" && propRule.type !== "Template") continue
    const moduleRule = propRule as ModulePropertyRule | TemplatePropertyRule
    const xmlPath = typeof moduleRule.xmlPath === "string" ? moduleRule.xmlPath : undefined
    const nkdkPath = typeof moduleRule.nkdkPath === "string" ? moduleRule.nkdkPath : undefined
    if (!xmlPath || !nkdkPath) continue
    const srcPath = join(inputDir, xmlPath)
    if (!fs.existsSync(srcPath)) continue
    const dstPath = join(outputDir, name, nkdkPath)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
  }

  const yamlObj = exportMetadataItemToYAML({ context, data: model, rule })
  const yaml = yamlObj != undefined ? exportToYAML(yamlObj) : ""

  const outputPath = join(outputDir, name)
  await fs.promises.mkdir(outputPath, { recursive: true })
  await fs.promises.writeFile(join(outputPath, PROPERTIES_YAML), yaml, "utf-8")
}
