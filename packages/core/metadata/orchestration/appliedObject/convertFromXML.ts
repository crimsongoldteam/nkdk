import fs from "fs"
import { join } from "path"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { exportMetadataItemToYAML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { getTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { importContentFromXML } from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"
import {
  getFileItemXMLRootContainer,
  normalizeFileItemCollectionItems,
  resolveChildCollectionDir,
} from "./fileItemChildCollections"
import { omitStringChildCollectionReferencesFromXML } from "./stringChildCollectionReferences"

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
  const modelXML = omitStringChildCollectionReferencesFromXML(parsed.MetaDataObject, rule)
  const model = importMetadataItemFromXML({ context, xml: modelXML, rule })

  if (!model) return
  addReferenceNamesFromXML({
    model: model as Record<string, unknown>,
    rule,
    xml: parsed.MetaDataObject,
  })

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

  const yamlObj = exportMetadataItemToYAML({ context, data: omitFileItemChildCollections(model, rule), rule })
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

  for (const childCollection of rule.childCollections ?? []) {
    const collectionModel = model[childCollection.propertyKey]
    const items = normalizeFileItemCollectionItems(collectionModel)
    if (items.length === 0) continue
    if (Array.isArray(collectionModel) || typeof collectionModel === "string") {
      model[childCollection.propertyKey] = items.map((item) => item.model)
    }

    for (const item of items) {
      const hasOwnDirs = childCollection.nkdkDir !== undefined || childCollection.xmlDir !== undefined
      const childNkdkDir = childCollection.nkdkDir
        ? join(nkdkDir, resolveChildCollectionDir(childCollection.nkdkDir, item.name, name))
        : nkdkDir
      const childXmlDir = childCollection.xmlDir
        ? resolveChildCollectionXmlDir({
            xmlDir,
            childDir: resolveChildCollectionDir(childCollection.xmlDir, item.name, name),
            parentName: name,
            xmlDirContainsCurrentItem: params.xmlDirContainsCurrentItem,
          })
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
        const externalSyncName = hasOwnDirs && isFileChildNameRule(itemPropRule) ? "" : syncName
        await syncFn({
          context,
          rule: itemPropRule,
          xmlDir: childXmlDir,
          nkdkDir: childNkdkDir,
          name: externalSyncName,
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

      if (childCollection.fileItemRule && childCollection.nkdkDir) {
        const childYamlObj = exportMetadataItemToYAML({
          context,
          data: omitFileItemChildCollections(item.model, childCollection.fileItemRule),
          rule: childCollection.fileItemRule,
        })
        const childYaml = childYamlObj !== undefined ? exportToYAML(childYamlObj) : ""
        await fs.promises.mkdir(childNkdkDir, { recursive: true })
        await fs.promises.writeFile(join(childNkdkDir, PROPERTIES_YAML), childYaml, "utf-8")
      }
    }
  }
}

function addReferenceNamesFromXML(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
  xml: unknown
}): void {
  if (!params.xml || typeof params.xml !== "object") return
  const container = getFileItemXMLRootContainer(params.rule)
  if (!container) return
  const root = (params.xml as Record<string, unknown>)[container]
  if (!root || typeof root !== "object") return

  for (const childCollection of params.rule.childCollections ?? []) {
    if (childCollection.fileItemRule && childCollection.xmlDir) {
      addStringChildCollectionReferencesFromXML({
        model: params.model,
        propertyKey: childCollection.propertyKey,
        propertyRule: params.rule.properties[childCollection.propertyKey],
        root: root as Record<string, unknown>,
      })
    }

  }
}

function addStringChildCollectionReferencesFromXML(params: {
  model: Record<string, unknown>
  propertyKey: string
  propertyRule: PropertyRule | undefined
  root: Record<string, unknown>
}): void {
  if (params.propertyRule === undefined) return

  const xmlKey = params.propertyRule.xml ?? params.propertyKey
  const xmlValue = readXMLPath(params.root, [...(params.propertyRule.xmlParents ?? []), xmlKey])
  if (!hasStringReference(xmlValue)) return

  const collectionModel = params.model[params.propertyKey]
  if (collectionModel === undefined) {
    const referenceNames = getStringReferenceNames(xmlValue)
    params.model[params.propertyKey] = referenceNames.map((name) => ({ name }))
    return
  }
  if (!Array.isArray(collectionModel)) return

  const importedItems = normalizeFileItemCollectionItems(collectionModel)
  const importedByName = new Map(importedItems.map((item) => [item.name, item.model]))
  const orderedModels: Record<string, unknown>[] = []
  const usedNames = new Set<string>()
  let nextImportedIndex = 0

  for (const xmlItem of Array.isArray(xmlValue) ? xmlValue : [xmlValue]) {
    const model = typeof xmlItem === "string" ? { name: xmlItem } : importedItems[nextImportedIndex++]?.model
    if (!model) continue
    const name = String(model["name"] ?? "")
    if (!name || usedNames.has(name)) continue

    orderedModels.push(importedByName.get(name) ?? model)
    usedNames.add(name)
  }

  for (const item of importedItems) {
    if (usedNames.has(item.name)) continue
    orderedModels.push(item.model)
    usedNames.add(item.name)
  }

  params.model[params.propertyKey] = orderedModels
}

function hasStringReference(xmlValue: unknown): boolean {
  return typeof xmlValue === "string" || (Array.isArray(xmlValue) && xmlValue.some((item) => typeof item === "string"))
}

function getStringReferenceNames(xmlValue: unknown): string[] {
  if (typeof xmlValue === "string") return [xmlValue]
  if (!Array.isArray(xmlValue)) return []
  return xmlValue.filter((item): item is string => typeof item === "string")
}

function readXMLPath(xml: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = xml
  for (const part of path) {
    if (!current || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function omitFileItemChildCollections(model: Record<string, unknown>, rule: MetadataItemRule): Record<string, unknown> {
  const result = { ...model }
  for (const childCollection of rule.childCollections ?? []) {
    if (!childCollection.fileItemRule) continue
    delete result[childCollection.propertyKey]
  }
  return result
}

function isFileChildNameRule(rule: PropertyRule): boolean {
  return (
    (rule.type === "ChildFormNames" && rule.xml === "Form") ||
    (rule.type === "ChildTemplateNames" && rule.xml === "Template")
  )
}

function resolveChildCollectionXmlDir(params: {
  xmlDir: string
  childDir: string
  parentName: string
  xmlDirContainsCurrentItem: boolean
}): string {
  const direct = join(params.xmlDir, params.childDir)
  if (fs.existsSync(`${direct}.xml`) || fs.existsSync(direct)) return direct

  if (params.xmlDirContainsCurrentItem) return direct

  const nested = join(params.xmlDir, params.parentName, params.childDir)
  if (fs.existsSync(`${nested}.xml`) || fs.existsSync(nested)) return nested

  return direct
}
