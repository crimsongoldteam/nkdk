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

  await syncChildCollectionsFromXML({
    context,
    rule,
    model: model as Record<string, unknown>,
    xmlDir: inputDir,
    nkdkDir,
    name,
    xmlDirContainsCurrentItem: false,
  })

  const yamlObj = exportMetadataItemToYAML({ context, data: model, rule })
  const yaml = yamlObj != undefined ? exportToYAML(yamlObj) : ""

  const outputPath = join(outputDir, name)
  await fs.promises.mkdir(outputPath, { recursive: true })
  await fs.promises.writeFile(join(outputPath, PROPERTIES_YAML), yaml, "utf-8")
}

async function syncChildCollectionsFromXML(params: {
  context: ConfigurationContextFromXML
  rule: MetadataItemRule
  model: Record<string, unknown>
  xmlDir: string
  nkdkDir: string
  name: string
  xmlDirContainsCurrentItem: boolean
}): Promise<void> {
  const { context, rule, model, xmlDir, nkdkDir, name } = params
  addChildCollectionsFromReferenceNames({ model, rule })

  for (const childCollection of rule.childCollections ?? []) {
    const collectionModel = model[childCollection.propertyKey]
    if (!collectionModel || typeof collectionModel !== "object") continue
    // После XML-импорта коллекция — массив [{name, ...}, ...], после YAML — Record<name, ...>
    const items = Array.isArray(collectionModel)
      ? (collectionModel as Array<Record<string, unknown>>)
          .map((item) => ({ name: String(item["name"] ?? ""), model: item }))
          .filter((item) => item.name)
      : Object.entries(collectionModel as Record<string, Record<string, unknown>>).map(([itemName, itemModel]) => ({
          name: itemName,
          model: { ...itemModel, name: itemName },
        }))

    for (const item of items) {
      const hasOwnDirs = childCollection.nkdkDir !== undefined || childCollection.xmlDir !== undefined
      const childNkdkDir = childCollection.nkdkDir
        ? join(nkdkDir, resolveChildCollectionDir(childCollection.nkdkDir, item.name, name))
        : nkdkDir
      const childXmlDir = childCollection.xmlDir
        ? join(xmlDir, resolveChildCollectionDir(childCollection.xmlDir, item.name, name))
        : xmlDir
      const syncName = hasOwnDirs ? item.name : params.xmlDirContainsCurrentItem ? "" : name

      if (childCollection.fileItemRule && childCollection.xmlDir) {
        const childXmlPath = `${childXmlDir}.xml`
        if (fs.existsSync(childXmlPath)) {
          const childXmlContent = await fs.promises.readFile(childXmlPath, "utf-8")
          const childParsed = importContentFromXML<{ MetaDataObject: unknown }>(childXmlContent)
          const childModel = importMetadataItemFromXML({
            context,
            xml: childParsed.MetaDataObject,
            rule: childCollection.fileItemRule,
          }) as Record<string, unknown> | undefined
          if (childModel) {
            Object.assign(item.model, childModel)
            addReferenceNamesFromXML({
              model: item.model,
              rule: childCollection.fileItemRule,
              xml: childParsed.MetaDataObject,
            })
          }
        }
      }

      for (const [, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
        const syncFn = getTypeRule(itemPropRule.type, "syncExternalFromXML")
        if (!syncFn) continue
        await syncFn({
          context,
          rule: itemPropRule,
          xmlDir: childXmlDir,
          nkdkDir: childNkdkDir,
          name: syncName,
          itemName: hasOwnDirs ? undefined : item.name,
        })
      }

      await syncChildCollectionsFromXML({
        context,
        rule: childCollection.itemRule,
        model: item.model,
        xmlDir: childXmlDir,
        nkdkDir: childNkdkDir,
        name: item.name,
        xmlDirContainsCurrentItem: params.xmlDirContainsCurrentItem || childCollection.xmlDir !== undefined,
      })
    }
  }
}

function addReferenceNamesFromXML(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
  xml: unknown
}): void {
  if (!params.xml || typeof params.xml !== "object") return
  const container = getXMLRootContainer(params.rule)
  if (!container) return
  const root = (params.xml as Record<string, unknown>)[container]
  if (!root || typeof root !== "object") return

  for (const childCollection of params.rule.childCollections ?? []) {
    const fileRootContainer = childCollection.fileItemRule
      ? getXMLRootContainer(childCollection.fileItemRule)
      : undefined
    if (!fileRootContainer) continue
    const referenceNamesEntry = Object.entries(params.rule.properties).find(([, propertyRule]) => {
      if (propertyRule.type !== "ChildFormNames") return false
      return propertyRule.xml === fileRootContainer
    })
    if (!referenceNamesEntry) continue
    const [propertyKey, propertyRule] = referenceNamesEntry
    const xmlValue = readXMLPath(root as Record<string, unknown>, [
      ...(propertyRule.xmlParents ?? []),
      fileRootContainer,
    ])
    if (xmlValue === undefined) continue
    params.model[propertyKey] = Array.isArray(xmlValue) ? xmlValue : [xmlValue]
  }
}

function readXMLPath(xml: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = xml
  for (const part of path) {
    if (!current || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function addChildCollectionsFromReferenceNames(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
}): void {
  for (const childCollection of params.rule.childCollections ?? []) {
    if (params.model[childCollection.propertyKey] !== undefined) continue
    const fileRootContainer = childCollection.fileItemRule
      ? getXMLRootContainer(childCollection.fileItemRule)
      : undefined
    if (!fileRootContainer) continue
    const referenceNamesEntry = Object.entries(params.rule.properties).find(([, propertyRule]) => {
      if (propertyRule.type !== "ChildFormNames") return false
      return propertyRule.xml === fileRootContainer
    })
    if (!referenceNamesEntry) continue
    const names = params.model[referenceNamesEntry[0]]
    if (!Array.isArray(names)) continue
    params.model[childCollection.propertyKey] = names
      .map((itemName) => (typeof itemName === "string" ? { name: itemName } : undefined))
      .filter((item): item is { name: string } => item !== undefined)
  }
}

function getXMLRootContainer(rule: MetadataItemRule): string | undefined {
  const xmlRootEntry = Object.entries(rule.properties).find(([, propertyRule]) => propertyRule.type === "XMLRoot")
  return xmlRootEntry ? (xmlRootEntry[1] as { container?: string }).container : undefined
}

const resolveChildCollectionDir = (
  dir: string | ((params: { name: string; parentName?: string }) => string),
  name: string,
  parentName?: string
): string => (typeof dir === "function" ? dir({ name, parentName }) : dir)
