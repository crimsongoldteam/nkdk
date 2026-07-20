import fs from "fs"
import { join } from "path"
import type { ConfigurationContextFromXML, ExternalFileEntry } from "../../context/types"
import { exportMetadataItemToYAML, importMetadataItemFromXML } from ".."
import { getTypeRule } from "../property/typeRuleRegistry"
import { importPropertyFromXML } from "../property/fromXML"
import type { FileChildNamesDescriptor } from "../property/fn"
import { metadataTargetOwnerFromRule } from "../property/metadataTargetString"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import { importContentFromXML } from "../../../xml/import/importer"
import { exportToYAML } from "../../../yaml/export"
import {
  getFileItemXMLRootContainer,
  normalizeFileItemCollectionItems,
  resolveChildCollectionDir,
} from "./fileItemChildCollections"
import {
  appendMetadataItemOwner,
  withExportMetadataTargetOwners,
  type MetadataItemOwnerContextEntry,
} from "./metadataItemOwnerContext"
import { childUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  runWithConfigurationIndexPropertyContext,
  withConfigurationIndexLogicalAddress,
} from "../../configurationIndex/collector/context"

const PROPERTIES_YAML = "Свойства.yaml"

const toMutableMetadataRecord = (model: unknown): Record<string, unknown> => model as Record<string, unknown>

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
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(xmlContent, { preserveXsiNil: true })
  const propertyXML = new Map<string, unknown>()

  for (const [key, propRule] of Object.entries(rule.properties)) {
    if (propRule.filePath === undefined) continue
    if (!getTypeRule(propRule.type, "importFromXML")) continue
    const rootExtFilePath = join(inputDir, propRule.filePath)
    const objectExtFilePath = join(inputDir, name, propRule.filePath)
    const extFilePath = fs.existsSync(rootExtFilePath) ? rootExtFilePath : objectExtFilePath
    if (!fs.existsSync(extFilePath)) continue
    const extContent = await fs.promises.readFile(extFilePath, "utf-8")
    propertyXML.set(key, importContentFromXML<Record<string, unknown>>(extContent, { preserveXsiNil: true }))
  }

  const model = prepareAppliedObjectModelFromXML({
    context,
    rule,
    name,
    metadataXML: parsed.MetaDataObject,
    propertyXML,
  })

  if (!model) return
  const mutableModel = toMutableMetadataRecord(model)

  // Обработчики внешних файлов на уровне объекта (Help, Module, Template со статическими путями)
  const nkdkDir = join(outputDir, name)
  const owner = metadataTargetOwnerFromRule({ itemRule: rule, name, context })
  const contextWithCurrentOwner = withExportMetadataTargetOwners(context, [
    { itemType: rule.itemType, name, path: "", ...(owner ? { owner } : {}) },
  ])
  for (const [, propRule] of Object.entries(rule.properties)) {
    const syncFn = getTypeRule(propRule.type, "syncExternalFromXML")
    if (!syncFn) continue
    await syncFn({ context: contextWithCurrentOwner, rule: propRule, xmlDir: inputDir, nkdkDir, name })
  }

  await syncChildCollectionsFromXML({
    context,
    rule,
    model: mutableModel,
    xmlDir: inputDir,
    nkdkDir,
    name,
    xmlDirContainsCurrentItem: false,
    ownerStack: [],
  })

  const externalFilesCollector: ExternalFileEntry[] = []
  const contextWithExternalFiles = withExternalFilesCollector(context, externalFilesCollector)
  const yamlObj = exportMetadataItemToYAML({
    context: contextWithExternalFiles,
    data: omitFileItemChildCollections(mutableModel, rule),
    rule,
  })
  const yaml = yamlObj != undefined ? exportToYAML(yamlObj) : ""

  const outputPath = join(outputDir, name)
  await fs.promises.mkdir(outputPath, { recursive: true })
  await fs.promises.writeFile(join(outputPath, PROPERTIES_YAML), yaml, "utf-8")
  await writeExternalFiles(outputPath, externalFilesCollector)
}

export function prepareAppliedObjectModelFromXML(params: {
  rule: MetadataItemRule
  context: ConfigurationContextFromXML
  name: string
  metadataXML: unknown
  propertyXML?: ReadonlyMap<string, unknown>
}): ReturnType<typeof importMetadataItemFromXML> {
  const model = importMetadataItemFromXML({ context: params.context, xml: params.metadataXML, rule: params.rule })
  if (model === undefined) return undefined

  const mutableModel = toMutableMetadataRecord(model)
  mutableModel.name = params.name
  addReferenceNamesFromXML({ model: mutableModel, rule: params.rule, xml: params.metadataXML })

  for (const [key, propRule] of Object.entries(params.rule.properties)) {
    const extParsed = params.propertyXML?.get(key)
    if (extParsed === undefined || !getTypeRule(propRule.type, "importFromXML")) continue
    const value = runWithConfigurationIndexPropertyContext(
      params.context,
      propRule.yaml ?? key,
      propRule.configurationIndexUidSegment ?? propRule.operationTarget?.migrationSegment,
      (context) => importPropertyFromXML({ context, rule: propRule as PropertyRule, value: extParsed, name: key })
    )
    if (value !== undefined) mutableModel[key] = value
  }

  return model
}

async function syncChildCollectionsFromXML(params: {
  context: ConfigurationContextFromXML
  rule: MetadataItemRule
  model: Record<string, unknown>
  xmlDir: string
  nkdkDir: string
  name: string
  xmlDirContainsCurrentItem: boolean
  ownerStack: readonly MetadataItemOwnerContextEntry[]
}): Promise<void> {
  const { rule, model, xmlDir, nkdkDir, name } = params
  const owner = metadataTargetOwnerFromRule({ itemRule: rule, name, context: params.context })
  const ownerStack = appendMetadataItemOwner(params.ownerStack, rule.itemType, name, "", owner)
  const context = withExportMetadataTargetOwners(params.context, [
    { itemType: rule.itemType, name, path: "", ...(owner ? { owner } : {}) },
  ])

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
      const collection = getConfigurationIndexCollectionContext(context)
      const childContext =
        collection === undefined
          ? context
          : withConfigurationIndexLogicalAddress(
              context,
              childUid(
                collection.logicalAddress,
                childCollection.configurationIndexUidSegment ?? childCollection.propertyKey,
                item.name
              )
            )

      if (childCollection.fileItemRule && childCollection.xmlDir) {
        const childXmlPath = `${childXmlDir}.xml`
        if (fs.existsSync(childXmlPath)) {
          const childXmlContent = await fs.promises.readFile(childXmlPath, "utf-8")
          const childParsed = importContentFromXML<{ MetaDataObject: unknown }>(childXmlContent, {
            preserveXsiNil: true,
          })
          const childModel = importMetadataItemFromXML({
            context: childContext,
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
        const descriptor = getFileChildNamesDescriptor(itemPropRule)
        const externalSyncName = hasOwnDirs && descriptor?.useOwnerDirectoryForExternalSync === true ? "" : syncName
        await syncFn({
          context: childContext,
          rule: itemPropRule,
          xmlDir: childXmlDir,
          nkdkDir: childNkdkDir,
          name: externalSyncName,
          itemName: hasOwnDirs ? undefined : item.name,
        })
      }

      await syncChildCollectionsFromXML({
        context: childContext,
        rule: childCollection.itemRule,
        model: item.model,
        xmlDir: childXmlDir,
        nkdkDir: childNkdkDir,
        name: item.name,
        xmlDirContainsCurrentItem: params.xmlDirContainsCurrentItem || childCollection.xmlDir !== undefined,
        ownerStack,
      })

      if (childCollection.fileItemRule && childCollection.nkdkDir) {
        const externalFilesCollector: ExternalFileEntry[] = []
        const contextWithExternalFiles = withExternalFilesCollector(context, externalFilesCollector)
        const contextWithChildParent = withExportParentName(contextWithExternalFiles, params.name)
        const childYamlObj = exportMetadataItemToYAML({
          context: contextWithChildParent,
          data: omitFileItemChildCollections(item.model, childCollection.fileItemRule),
          rule: childCollection.fileItemRule,
        })
        const childYaml = childYamlObj !== undefined ? exportToYAML(childYamlObj) : ""
        await fs.promises.mkdir(childNkdkDir, { recursive: true })
        await fs.promises.writeFile(join(childNkdkDir, PROPERTIES_YAML), childYaml, "utf-8")
        await writeExternalFiles(childNkdkDir, externalFilesCollector)
      }
    }
  }
}

function withExportParentName(context: ConfigurationContextFromXML, name: string): ConfigurationContextFromXML {
  return context.exportToYAML
    ? {
        ...context,
        exportToYAML: {
          ...context.exportToYAML,
          parent: { name },
        },
      }
    : context
}

function withExternalFilesCollector(
  context: ConfigurationContextFromXML,
  externalFilesCollector: ExternalFileEntry[]
): ConfigurationContextFromXML {
  return context.exportToYAML
    ? {
        ...context,
        exportToYAML: {
          ...context.exportToYAML,
          externalFilesCollector,
        },
      }
    : context
}

async function writeExternalFiles(baseDir: string, externalFiles: ExternalFileEntry[]): Promise<void> {
  for (const { relativePath, content } of externalFiles) {
    const filePath = join(baseDir, relativePath)
    await fs.promises.mkdir(join(filePath, ".."), { recursive: true })
    await fs.promises.writeFile(filePath, content, "utf-8")
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

function getFileChildNamesDescriptor(rule: PropertyRule): FileChildNamesDescriptor | undefined {
  return getTypeRule(rule.type, "fileChildNamesDescriptor")?.({ propertyRule: rule })
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
