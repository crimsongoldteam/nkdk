import fs from "fs"
import { join } from "path"
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

  // Читаем внешние файлы для свойств с filePath. Под капотом importPropertyFromXML
  // диспатчит по rule.type — для типов, зарегистрированных через registerMetadataItemRule
  // с маркером XMLRoot+isFileRoot, оркестратор сам снимает обёртку контейнера.
  // Свойства типа Help/Module/Template с filePath обрабатываются отдельно ниже,
  // через syncExternalFromXML (у них нет importFromXML-обработчика).
  for (const [key, propRule] of Object.entries(rule.properties)) {
    if (propRule.filePath === undefined) continue
    if (!getTypeRule(propRule.type, "importFromXML")) continue
    const rootExtFilePath = join(inputDir, propRule.filePath)
    const objectExtFilePath = join(inputDir, name, propRule.filePath)
    const extFilePath = fs.existsSync(rootExtFilePath) ? rootExtFilePath : objectExtFilePath
    if (!fs.existsSync(extFilePath)) continue
    const extContent = await fs.promises.readFile(extFilePath, "utf-8")
    const extParsed = importContentFromXML<Record<string, unknown>>(extContent)
    const value = importPropertyFromXML({ context, rule: propRule as PropertyRule, value: extParsed, name: key })
    if (value !== undefined) (model as Record<string, unknown>)[key] = value
  }

  // Обработчики внешних файлов на уровне объекта (Help, Module, Template со статическими путями)
  const nkdkDir = join(outputDir, name)
  for (const [, propRule] of Object.entries(rule.properties)) {
    const syncFn = getTypeRule(propRule.type, "syncExternalFromXML")
    if (!syncFn) continue
    await syncFn({ context, rule: propRule, xmlDir: inputDir, nkdkDir, name })
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
        await syncFn({ context, rule: itemPropRule, xmlDir: inputDir, nkdkDir, name, itemName })
      }
    }
  }

  const yamlObj = exportMetadataItemToYAML({ context, data: model, rule })
  const yaml = yamlObj != undefined ? exportToYAML(yamlObj) : ""

  const outputPath = join(outputDir, name)
  await fs.promises.mkdir(outputPath, { recursive: true })
  await fs.promises.writeFile(join(outputPath, PROPERTIES_YAML), yaml, "utf-8")
}
