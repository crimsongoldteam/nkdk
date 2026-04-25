import fs from "fs"
import { join } from "path"
import { externalFileEnvelopes } from "~/metadata/commonObjects/predefined/rules"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { exportMetadataItemToYAML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { getTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
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

  // Читаем внешние файлы для свойств с filePath (envelope-типы: Predefined, AdditionalIndex)
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

  // Обработчики внешних файлов на уровне объекта (Help, Module, Template со статическими путями)
  const nkdkDir = join(outputDir, name)
  for (const [, propRule] of Object.entries(rule.properties)) {
    const syncFn = getTypeRule(propRule.type, "syncExternalFromXML")
    if (!syncFn) continue
    await syncFn({ context, rule: propRule, xmlDir: inputDir, nkdkDir })
  }

  // Обработчики внешних файлов для дочерних коллекций (команды с функциональными путями)
  for (const childCollection of rule.childCollections ?? []) {
    const collectionModel = (model as Record<string, unknown>)[childCollection.propertyKey]
    if (!collectionModel || typeof collectionModel !== "object") continue
    // После XML-импорта коллекция — массив [{name, ...}, ...], после YAML — Record<name, ...>
    const itemNames: string[] = Array.isArray(collectionModel)
      ? (collectionModel as Array<Record<string, unknown>>).map((item) => String(item["name"] ?? "")).filter(Boolean)
      : Object.keys(collectionModel)
    for (const itemName of itemNames) {
      for (const [, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
        const syncFn = getTypeRule(itemPropRule.type, "syncExternalFromXML")
        if (!syncFn) continue
        await syncFn({ context, rule: itemPropRule, xmlDir: inputDir, nkdkDir, itemName })
      }
    }
  }

  const yamlObj = exportMetadataItemToYAML({ context, data: model, rule })
  const yaml = yamlObj != undefined ? exportToYAML(yamlObj) : ""

  const outputPath = join(outputDir, name)
  await fs.promises.mkdir(outputPath, { recursive: true })
  await fs.promises.writeFile(join(outputPath, PROPERTIES_YAML), yaml, "utf-8")
}
