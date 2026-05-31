import fs from "fs"
import { dirname, join } from "path"
import { remapReferenceModel } from "~/metadata/appliedObjects/configuration/migrations/referenceRemap"
import { getChildContextToXML } from "~/metadata/context/helpers"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import {
  exportMetadataItemToXML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
} from "~/metadata/orchestration"
import { getTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { exportPropertyToXML } from "~/metadata/orchestration/property/toXML"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { importFromYAML } from "~/yaml/import"

const PROPERTIES_YAML = "Свойства.yaml"

export const syncAppliedObjectToXML = async (params: {
  rule: MetadataItemRule
  context: ConfigurationContextWithExportToXML
  inputDir: string
  name: string
  outputDir: string
  externalOutputDir?: string
  referenceDir?: string
  externalReferenceDir?: string
  referenceName?: string
  referenceModel?: Record<string, unknown> | null
  referencePathByCurrentPath?: Map<string, string>
  currentObjectPath?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const { rule, context, inputDir, name, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir
  const externalOutputDir = params.externalOutputDir ?? outputDir
  const externalReferenceDir = params.externalReferenceDir ?? referenceDir
  const hasExplicitExternalOutputDir = params.externalOutputDir !== undefined
  const hasExplicitExternalReferenceDir = params.externalReferenceDir !== undefined

  const yamlPath = join(inputDir, name, PROPERTIES_YAML)
  const yamlContent = await fs.promises.readFile(yamlPath, "utf-8")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yamlObj = importFromYAML<any>(yamlContent)

  const contextFromXML: ConfigurationContextFromXML = {
    fromXML: { forReference: true },
    defaultLanguage: context.defaultLanguage,
    version: "2.20",
  }

  const referenceName = params.referenceName ?? name
  const referenceXmlPath = join(referenceDir, `${referenceName}.xml`)
  const loadedReferenceModel =
    params.referenceModel === undefined
      ? readReferenceModel({ context: contextFromXML, xmlPath: referenceXmlPath, rule })
      : (params.referenceModel ?? undefined)
  const filePathReferenceValues =
    params.referenceModel === null
      ? {}
      : readFilePathReferenceValues({
          context: contextFromXML,
          rule,
          externalReferenceDir,
          referenceName,
          hasExplicitExternalReferenceDir,
        })
  const sourceForYAMLImport =
    params.referenceModel === null
      ? undefined
      : filterFilePathReferenceValuesForYAMLImport({
          rule,
          yaml: yamlObj,
          filePathReferenceValues,
        })
  const rawModel = importMetadataItemFromYAML({ context, yaml: yamlObj, rule, name, source: sourceForYAMLImport })

  if (!rawModel) return
  const model = { ...rawModel, name } as typeof rawModel

  const referenceModel =
    params.referencePathByCurrentPath?.size && params.currentObjectPath
      ? remapReferenceModel({
          rule,
          currentObjectPath: params.currentObjectPath,
          currentModel: model as Record<string, unknown>,
          referenceModel: loadedReferenceModel as Record<string, unknown> | undefined,
          referencePathByCurrentPath: params.referencePathByCurrentPath,
        })
      : loadedReferenceModel

  const forms = await collectFolderNames(rule, "ChildFormNames", inputDir, name)
  const templates = await collectFolderNames(rule, "ChildTemplateNames", inputDir, name)

  const contextWithForms: ConfigurationContextWithExportToXML = {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      context: {
        ...context.exportToXML.context,
        forms,
        templates,
        parentName: name,
        metadataForNumbering: context.exportToXML.context?.metadataForNumbering ?? [],
      },
    },
  }

  const xmlObj = exportMetadataItemToXML({
    context: contextWithForms,
    data: addFileChildCollectionReferenceNames({
      model: model as Record<string, unknown>,
      rule,
    }) as typeof model,
    referenceData: referenceModel,
    rule,
  })

  if (!xmlObj) return

  await fs.promises.mkdir(outputDir, { recursive: true })
  const outputPath = join(outputDir, `${name}.xml`)
  await fs.promises.writeFile(outputPath, xmlExport(xmlObj), "utf-8")
  params.xmlManifest?.addFile(outputPath)

  // Обработчики внешних файлов на уровне объекта (Help, Module, Template со статическими путями)
  const nkdkDir = join(inputDir, name)
  for (const [key, propRule] of Object.entries(rule.properties)) {
    const syncFn = getTypeRule(propRule.type, "syncExternalToXML")
    if (!syncFn) continue
    const syncUsesItemDir = propRule.type === "ChildFormNames" || propRule.type === "ChildTemplateNames"
    const syncXmlDir = syncUsesItemDir ? outputDir : externalOutputDir
    const syncReferenceDir = syncUsesItemDir ? referenceDir : externalReferenceDir
    await syncFn({
      context: contextWithForms,
      rule: propRule,
      nkdkDir,
      xmlDir: syncXmlDir,
      name,
      referenceDir: syncReferenceDir,
      referenceName,
      propertyValue: (model as Record<string, unknown>)[key],
      referencePropertyValue:
        referenceModel === undefined ? undefined : (referenceModel as Record<string, unknown>)[key],
      xmlManifest: params.xmlManifest,
    })
  }

  await syncChildCollectionExternalFilesToXML({
    context: contextWithForms,
    rule,
    model: model as Record<string, unknown>,
    nkdkDir,
    xmlDir: externalOutputDir,
    referenceDir: externalReferenceDir,
    name,
    referenceName,
    xmlManifest: params.xmlManifest,
    xmlDirContainsCurrentItem: false,
  })

  // Записываем внешние файлы для свойств с filePath. Под капотом exportPropertyToXML
  // диспатчит по rule.type → registerMetadataItemRule, и для типов с маркером
  // XMLRoot+isFileRoot правило само оборачивает результат в { [container]: {...} }.
  // Reference читается из эталонного XML и передаётся в exportPropertyToXML, чтобы
  // (а) сохранить точный порядок полей по эталону, (б) подмешать атрибуты id, помеченные
  // forReferenceOnly. Свойства Help/Module/Template обрабатываются отдельно выше через
  // syncExternalToXML (у них нет exportToXML-обработчика).
  for (const [key, propRule] of Object.entries(rule.properties)) {
    if (propRule.filePath === undefined) continue
    if (!getTypeRule(propRule.type, "exportToXML")) continue

    const modelHasOwnValue = Object.prototype.hasOwnProperty.call(model as Record<string, unknown>, key)
    const modelValue = (model as Record<string, unknown>)[key]

    const referenceValue = filePathReferenceValues[key]
    const rootReferenceExtPath = join(externalReferenceDir, propRule.filePath)

    const valueToExport = modelHasOwnValue
      ? modelValue
      : propRule.exportReferenceFileOnMissingValue === true
        ? referenceValue
        : undefined
    if (valueToExport === undefined) continue

    const xmlFileObj = exportPropertyToXML({
      context: contextWithForms,
      rule: propRule as PropertyRule,
      value: valueToExport,
      referenceMetadata: referenceValue,
    }) as Record<string, unknown> | undefined
    if (!xmlFileObj) continue

    const extOutputPath =
      fs.existsSync(rootReferenceExtPath) || hasExplicitExternalOutputDir
        ? join(externalOutputDir, propRule.filePath)
        : join(externalOutputDir, name, propRule.filePath)
    await fs.promises.mkdir(dirname(extOutputPath), { recursive: true })
    await fs.promises.writeFile(extOutputPath, xmlExport(xmlFileObj), "utf-8")
    params.xmlManifest?.addFile(extOutputPath)
  }
}

async function syncChildCollectionExternalFilesToXML(params: {
  context: ConfigurationContextWithExportToXML
  rule: MetadataItemRule
  model: Record<string, unknown>
  nkdkDir: string
  xmlDir: string
  referenceDir: string
  name: string
  referenceName?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
  xmlDirContainsCurrentItem: boolean
}): Promise<void> {
  const { context, rule, model, nkdkDir, xmlDir, referenceDir, name, referenceName, xmlManifest } = params

  for (const childCollection of rule.childCollections ?? []) {
    const collectionModel = model[childCollection.propertyKey]
    if (!collectionModel || typeof collectionModel !== "object") continue

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
      const childReferenceDir = childCollection.xmlDir
        ? join(referenceDir, resolveChildCollectionDir(childCollection.xmlDir, item.name, referenceName ?? name))
        : referenceDir
      const syncName = hasOwnDirs ? item.name : params.xmlDirContainsCurrentItem ? "" : name
      const syncReferenceName = hasOwnDirs ? item.name : params.xmlDirContainsCurrentItem ? "" : referenceName
      const childContext = getChildContextToXML({
        context,
        itemType: rule.itemType,
        path: `${rule.itemType}.${name}`,
        name,
      })

      if (childCollection.fileItemRule && childCollection.xmlDir) {
        const childReferencePath = `${childReferenceDir}.xml`
        const childReferenceModel = readReferenceModel({
          context: {
            fromXML: { forReference: true },
            defaultLanguage: context.defaultLanguage,
            version: "2.20",
          },
          xmlPath: childReferencePath,
          rule: childCollection.fileItemRule,
        })
        const childModelForXML = addChildCollectionReferenceNames({
          model: addFileChildCollectionReferenceNames({
            model: item.model,
            rule: childCollection.fileItemRule,
          }),
          rule: childCollection.fileItemRule,
        })
        const childXmlObj = exportMetadataItemToXML({
          context: childContext,
          data: childModelForXML as never,
          referenceData: childReferenceModel as never,
          rule: childCollection.fileItemRule,
        })
        if (childXmlObj) {
          const childOutputPath = `${childXmlDir}.xml`
          await fs.promises.mkdir(dirname(childOutputPath), { recursive: true })
          await fs.promises.writeFile(childOutputPath, xmlExport(childXmlObj), "utf-8")
          xmlManifest?.addFile(childOutputPath)
        }
      }

      for (const [, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
        const syncFn = getTypeRule(itemPropRule.type, "syncExternalToXML")
        if (!syncFn) continue
        await syncFn({
          context,
          rule: itemPropRule,
          nkdkDir: childNkdkDir,
          xmlDir: childXmlDir,
          name: syncName,
          referenceDir: childReferenceDir,
          referenceName: syncReferenceName,
          xmlManifest,
          itemName: hasOwnDirs ? undefined : item.name,
        })
      }

      await syncChildCollectionExternalFilesToXML({
        context: childContext,
        rule: childCollection.itemRule,
        model: item.model,
        nkdkDir: childNkdkDir,
        xmlDir: childXmlDir,
        referenceDir: childReferenceDir,
        name: item.name,
        referenceName: item.name,
        xmlManifest,
        xmlDirContainsCurrentItem: params.xmlDirContainsCurrentItem || childCollection.xmlDir !== undefined,
      })
    }
  }
}

function addChildCollectionReferenceNames(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
}): Record<string, unknown> {
  const result = { ...params.model }
  for (const childCollection of params.rule.childCollections ?? []) {
    const collectionModel = result[childCollection.propertyKey]
    if (!collectionModel || typeof collectionModel !== "object") continue

    const itemNames = Array.isArray(collectionModel)
      ? (collectionModel as Array<Record<string, unknown>>).map((item) => String(item["name"] ?? "")).filter(Boolean)
      : Object.keys(collectionModel)
    if (itemNames.length === 0) continue

    const fileRootContainer = childCollection.fileItemRule
      ? getXMLRootContainer(childCollection.fileItemRule)
      : undefined
    if (!fileRootContainer) continue
    const referenceNamesEntry = Object.entries(params.rule.properties).find(([, propertyRule]) => {
      if (propertyRule.type !== "ChildFormNames") return false
      return propertyRule.xml === fileRootContainer
    })
    if (!referenceNamesEntry) continue

    result[referenceNamesEntry[0]] = itemNames
  }
  return result
}

function addFileChildCollectionReferenceNames(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
}): Record<string, unknown> {
  const result = { ...params.model }
  for (const childCollection of params.rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue
    const collectionModel = result[childCollection.propertyKey]
    if (!collectionModel || typeof collectionModel !== "object") continue

    const itemNames = Array.isArray(collectionModel)
      ? (collectionModel as Array<Record<string, unknown>>).map((item) => String(item["name"] ?? "")).filter(Boolean)
      : Object.keys(collectionModel)
    if (itemNames.length === 0) continue

    result[childCollection.propertyKey] = itemNames
  }
  return result
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

function filterFilePathReferenceValuesForYAMLImport(params: {
  rule: MetadataItemRule
  yaml: Record<string, unknown> | undefined
  filePathReferenceValues: Record<string, unknown>
}): Record<string, unknown> {
  const { rule, yaml, filePathReferenceValues } = params
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(filePathReferenceValues)) {
    const propRule = rule.properties[key]
    if (!propRule) continue
    const yamlKey = propRule.yaml
    const hasYAMLValue =
      yaml !== undefined && yamlKey !== undefined && Object.prototype.hasOwnProperty.call(yaml, yamlKey)
    if (!hasYAMLValue && propRule.exportReferenceFileOnMissingValue !== true) continue
    result[key] = value
  }

  return result
}

function readFilePathReferenceValues(params: {
  context: ConfigurationContextFromXML
  rule: MetadataItemRule
  externalReferenceDir: string
  referenceName: string
  hasExplicitExternalReferenceDir: boolean
}): Record<string, unknown> {
  const { context, rule, externalReferenceDir, referenceName, hasExplicitExternalReferenceDir } = params
  const result: Record<string, unknown> = {}

  for (const [key, propRule] of Object.entries(rule.properties)) {
    if (propRule.filePath === undefined) continue
    if (!getTypeRule(propRule.type, "exportToXML")) continue
    if (!getTypeRule(propRule.type, "importFromXML")) continue

    const referenceExtPath = resolveReferenceFilePath({
      externalReferenceDir,
      filePath: propRule.filePath,
      referenceName,
      hasExplicitExternalReferenceDir,
    })
    if (!fs.existsSync(referenceExtPath)) continue

    const refContent = fs.readFileSync(referenceExtPath, "utf-8")
    const refParsed = importContentFromXML<Record<string, unknown>>(refContent)
    result[key] = importPropertyFromXML({
      context,
      rule: propRule as PropertyRule,
      value: refParsed,
      name: key,
    })
  }

  return result
}

function resolveReferenceFilePath(params: {
  externalReferenceDir: string
  filePath: string
  referenceName: string
  hasExplicitExternalReferenceDir: boolean
}): string {
  const { externalReferenceDir, filePath, referenceName, hasExplicitExternalReferenceDir } = params
  const rootReferenceExtPath = join(externalReferenceDir, filePath)
  const objectReferenceExtPath = hasExplicitExternalReferenceDir
    ? rootReferenceExtPath
    : join(externalReferenceDir, referenceName, filePath)
  return fs.existsSync(rootReferenceExtPath) ? rootReferenceExtPath : objectReferenceExtPath
}

function readReferenceModel<Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextFromXML
  xmlPath: string
  rule: Rule
}) {
  const { context, xmlPath, rule } = params
  if (!fs.existsSync(xmlPath)) return undefined
  const xmlContent = fs.readFileSync(xmlPath, "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(xmlContent)
  const xml = omitStringChildCollectionReferencesFromXML(parsed.MetaDataObject, rule)
  return importMetadataItemFromXML({ context, xml, rule }) ?? undefined
}

function omitStringChildCollectionReferencesFromXML(xml: unknown, rule: MetadataItemRule): unknown {
  if (!xml || typeof xml !== "object") return xml
  const container = getXMLRootContainer(rule)
  if (!container) return xml
  const root = (xml as Record<string, unknown>)[container]
  if (!root || typeof root !== "object") return xml

  let nextRoot: Record<string, unknown> | undefined
  for (const childCollection of rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue
    const propertyRule = rule.properties[childCollection.propertyKey]
    if (!propertyRule) continue

    const xmlKey = propertyRule.xml ?? childCollection.propertyKey
    const xmlPath = [...(propertyRule.xmlParents ?? []), xmlKey]
    const currentRoot = nextRoot ?? (root as Record<string, unknown>)
    const xmlValue = readXMLPath(currentRoot, xmlPath)
    if (
      typeof xmlValue !== "string" &&
      (!Array.isArray(xmlValue) || !xmlValue.some((item) => typeof item === "string"))
    ) {
      continue
    }

    const objectReferences = Array.isArray(xmlValue) ? xmlValue.filter((item) => typeof item !== "string") : undefined
    nextRoot = writeXMLPath(currentRoot, xmlPath, objectReferences)
  }

  return nextRoot ? { ...(xml as Record<string, unknown>), [container]: nextRoot } : xml
}

function readXMLPath(xml: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = xml
  for (const part of path) {
    if (!current || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function writeXMLPath(root: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const nextRoot = { ...root }
  let current = nextRoot
  for (const part of path.slice(0, -1)) {
    const next = current[part]
    if (!next || typeof next !== "object" || Array.isArray(next)) return nextRoot
    const nextCopy = { ...(next as Record<string, unknown>) }
    current[part] = nextCopy
    current = nextCopy
  }

  const key = path[path.length - 1]
  if (value === undefined) {
    delete current[key]
  } else {
    current[key] = value
  }
  return nextRoot
}

const listSubdirNames = async (dir: string): Promise<string[]> => {
  if (!fs.existsSync(dir)) return []
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

async function collectFolderNames(
  rule: MetadataItemRule,
  propertyType: "ChildFormNames" | "ChildTemplateNames",
  inputDir: string,
  name: string
): Promise<string[]> {
  const prop = Object.values(rule.properties).find((p) => p.type === propertyType)
  if (!prop) return []
  const folderName = (prop as { folderName: string }).folderName
  return listSubdirNames(join(inputDir, name, folderName))
}
