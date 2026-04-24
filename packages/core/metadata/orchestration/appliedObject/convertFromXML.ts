import fs from "fs"
import { dirname, join } from "path"
import { externalFileEnvelopes } from "~/metadata/commonObjects/predefined/rules"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { exportMetadataItemToYAML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import type {
  HelpPropertyRule,
  MetadataItemRule,
  ModulePropertyRule,
  PropertyRule,
  TemplatePropertyRule,
} from "~/metadata/orchestration/property/types"
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

  // Копируем HTML-файлы справки для свойств типа Help
  for (const [_key, propRule] of Object.entries(rule.properties)) {
    if (propRule.type !== "Help") continue
    const helpRule = propRule as HelpPropertyRule
    const helpXmlPath = join(inputDir, helpRule.filePath)
    if (!fs.existsSync(helpXmlPath)) continue
    const helpXmlContent = await fs.promises.readFile(helpXmlPath, "utf-8")
    const helpParsed = importContentFromXML<{ Help: { Page?: string | string[] } }>(helpXmlContent)
    const pages = helpParsed.Help?.Page
    const langs: string[] = pages === undefined ? [] : Array.isArray(pages) ? pages : [pages]
    const helpHtmlDir = helpRule.filePath.replace(/\.xml$/, "")
    for (const lang of langs) {
      const srcHtmlPath = join(inputDir, helpHtmlDir, `${lang}.html`)
      if (!fs.existsSync(srcHtmlPath)) continue
      const dstHtmlPath = join(outputDir, name, helpRule.nkdkDir, `${lang}.html`)
      await fs.promises.mkdir(dirname(dstHtmlPath), { recursive: true })
      await fs.promises.copyFile(srcHtmlPath, dstHtmlPath)
    }
  }

  // Копируем BSL-файлы для свойств типа Module/Template (статические пути на уровне объекта)
  for (const [_key, propRule] of Object.entries(rule.properties)) {
    if (propRule.type !== "Module" && propRule.type !== "Template") continue
    const moduleRule = propRule as ModulePropertyRule | TemplatePropertyRule
    if (typeof moduleRule.xmlPath === "function" || typeof moduleRule.nkdkPath === "function") continue
    const srcPath = join(inputDir, moduleRule.xmlPath)
    if (!fs.existsSync(srcPath)) continue
    const dstPath = join(outputDir, name, moduleRule.nkdkPath)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
  }

  // Копируем BSL-файлы для дочерних коллекций (команды и т. п.) с функциональными путями
  for (const childCollection of rule.childCollections ?? []) {
    const collectionModel = (model as Record<string, unknown>)[childCollection.propertyKey]
    if (!collectionModel || typeof collectionModel !== "object") continue
    // После XML-импорта коллекция — массив [{name, ...}, ...], после YAML — Record<name, ...>
    const itemNames: string[] = Array.isArray(collectionModel)
      ? (collectionModel as Array<Record<string, unknown>>).map((item) => String(item["name"] ?? "")).filter(Boolean)
      : Object.keys(collectionModel)
    for (const itemName of itemNames) {
      for (const [_k, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
        if (itemPropRule.type !== "Module" && itemPropRule.type !== "Template") continue
        const moduleRule = itemPropRule as ModulePropertyRule | TemplatePropertyRule
        const xmlPath =
          typeof moduleRule.xmlPath === "function" ? moduleRule.xmlPath({ name: itemName }) : moduleRule.xmlPath
        const nkdkPath =
          typeof moduleRule.nkdkPath === "function" ? moduleRule.nkdkPath({ name: itemName }) : moduleRule.nkdkPath
        const srcPath = join(inputDir, xmlPath)
        if (!fs.existsSync(srcPath)) continue
        const dstPath = join(outputDir, name, nkdkPath)
        await fs.promises.mkdir(dirname(dstPath), { recursive: true })
        await fs.promises.copyFile(srcPath, dstPath)
      }
    }
  }

  const yamlObj = exportMetadataItemToYAML({ context, data: model, rule })
  const yaml = yamlObj != undefined ? exportToYAML(yamlObj) : ""

  const outputPath = join(outputDir, name)
  await fs.promises.mkdir(outputPath, { recursive: true })
  await fs.promises.writeFile(join(outputPath, PROPERTIES_YAML), yaml, "utf-8")
}
