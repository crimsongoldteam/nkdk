import fs from "fs"
import { dirname, join, posix } from "path"
import { getChildContextToXML } from "~/metadata/context/helpers"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import {
  exportMetadataItemToXML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
} from "~/metadata/orchestration"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { exportPropertyToXML } from "~/metadata/orchestration/property/toXML"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { importFromYAML } from "~/yaml/import"
import {
  getFileItemXMLRootContainer,
  listYAMLFileItemNames,
  normalizeFileItemCollectionItems,
  orderFileItemNames,
  resolveChildCollectionDir,
} from "./fileItemChildCollections"
import { omitStringChildCollectionReferencesFromXML } from "./stringChildCollectionReferences"

const PROPERTIES_YAML = "Свойства.yaml"

export type ReferenceModelRemapper = (params: {
  rule: MetadataItemRule
  currentModel: Record<string, unknown>
  referenceModel: Record<string, unknown> | undefined
}) => Record<string, unknown> | undefined

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
  referenceModelRemapper?: ReferenceModelRemapper
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  const { rule, context, inputDir, name, outputDir } = params
  const referenceDir = params.referenceDir
  const externalOutputDir = params.externalOutputDir ?? outputDir
  const externalReferenceDir = params.externalReferenceDir ?? referenceDir
  const hasExplicitExternalOutputDir = params.externalOutputDir !== undefined
  const hasExplicitExternalReferenceDir = params.externalReferenceDir !== undefined
  const nkdkDir = join(inputDir, name)

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
  const referenceXmlPath = referenceDir ? join(referenceDir, `${referenceName}.xml`) : undefined
  const loadedReferenceModel =
    params.referenceModel === undefined && referenceXmlPath
      ? readReferenceModel({ context: contextFromXML, xmlPath: referenceXmlPath, rule })
      : (params.referenceModel ?? undefined)
  const filePathReferenceValues =
    params.referenceModel === null || !externalReferenceDir
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
  const contextWithFormDir = withImportFormDir(context, nkdkDir)
  const rawModel = importMetadataItemFromYAML({
    context: contextWithFormDir,
    yaml: yamlObj,
    rule,
    name,
    source: sourceForYAMLImport,
  })

  if (!rawModel) return
  const model = { ...rawModel, name } as typeof rawModel

  const referenceModel = params.referenceModelRemapper
    ? params.referenceModelRemapper({
        rule,
        currentModel: model as Record<string, unknown>,
        referenceModel: loadedReferenceModel as Record<string, unknown> | undefined,
      })
    : loadedReferenceModel

  await addFileItemChildCollectionsFromYAML({
    context: contextWithFormDir,
    rule,
    model: model as Record<string, unknown>,
    nkdkDir,
    parentName: name,
    referenceDir: externalReferenceDir,
    referenceName,
  })

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
  const contextWithOwner = getChildContextToXML({
    context: contextWithForms,
    itemType: rule.itemType,
    path: `${rule.itemType}.${name}`,
    name,
  })

  const xmlObj = exportMetadataItemToXML({
    context: contextWithForms,
    data: addFileChildCollectionReferenceNames({
      model: model as Record<string, unknown>,
      rule,
    }) as typeof model,
    referenceData: referenceModel,
    rule: withFileItemCollectionReferenceExportRules(rule),
  })

  if (!xmlObj) return

  await fs.promises.mkdir(outputDir, { recursive: true })
  const outputPath = join(outputDir, `${name}.xml`)
  await fs.promises.writeFile(outputPath, xmlExport(xmlObj), "utf-8")
  params.xmlManifest?.addFile(outputPath)

  // Обработчики внешних файлов на уровне объекта (Help, Module, Template со статическими путями)
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
      referencePropertyValue:
        referenceModel === undefined ? undefined : (referenceModel as Record<string, unknown>)[key],
      xmlManifest: params.xmlManifest,
      propertyValue:
        propRule.type === "ChildFormNames"
          ? getExpectedFormNames({ rule, model: model as Record<string, unknown> })
          : (model as Record<string, unknown>)[key],
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
    xmlRelativeDir: undefined,
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
    const rootReferenceExtPath = externalReferenceDir ? join(externalReferenceDir, propRule.filePath) : undefined

    const valueToExport = modelHasOwnValue
      ? modelValue
      : propRule.exportReferenceFileOnMissingValue === true
        ? referenceValue
        : undefined
    if (valueToExport === undefined) continue

    const xmlFileObj = exportPropertyToXML({
      context: contextWithOwner,
      rule: propRule as PropertyRule,
      value: valueToExport,
      metadataItem: model,
      referenceMetadata: referenceValue,
    }) as Record<string, unknown> | undefined
    if (!xmlFileObj) continue

    const extOutputPath =
      (rootReferenceExtPath && fs.existsSync(rootReferenceExtPath)) || hasExplicitExternalOutputDir
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
  referenceDir?: string
  name: string
  referenceName?: string
  xmlManifest?: XmlWriteManifest
  xmlDirContainsCurrentItem: boolean
  xmlRelativeDir?: string
}): Promise<void> {
  const { context, rule, model, nkdkDir, xmlDir, referenceDir, name, referenceName, xmlManifest } = params

  for (const childCollection of rule.childCollections ?? []) {
    const collectionModel = model[childCollection.propertyKey]
    const items = normalizeFileItemCollectionItems(collectionModel)
    if (items.length === 0) continue

    for (const item of items) {
      const hasOwnDirs = childCollection.nkdkDir !== undefined || childCollection.xmlDir !== undefined
      const childNkdkDir = childCollection.nkdkDir
        ? join(nkdkDir, resolveChildCollectionDir(childCollection.nkdkDir, item.name, name))
        : nkdkDir
      const childXmlDir = childCollection.xmlDir
        ? join(xmlDir, resolveChildCollectionDir(childCollection.xmlDir, item.name, name))
        : xmlDir
      const childXMLRelativeDir = childCollection.xmlDir
        ? posix.join(
            params.xmlRelativeDir ?? "",
            normalizeXMLPath(resolveChildCollectionDir(childCollection.xmlDir, item.name, name))
          )
        : params.xmlRelativeDir
      const childReferenceDir =
        referenceDir && childCollection.xmlDir
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
        const childReferenceModel = childReferenceDir
          ? readReferenceModel({
              context: {
                fromXML: { forReference: true },
                defaultLanguage: context.defaultLanguage,
                version: "2.20",
              },
              xmlPath: `${childReferenceDir}.xml`,
              rule: childCollection.fileItemRule,
            })
          : undefined
        const childModelForXML = addChildCollectionReferenceNames({
          model: await addChildNameProperties({
            model: addReferenceChildNameProperties({
              model: addFileChildCollectionReferenceNames({
                model: item.model,
                rule: childCollection.fileItemRule,
              }),
              referenceModel: childReferenceModel as Record<string, unknown> | undefined,
              rule: childCollection.fileItemRule,
            }),
            nkdkDir: childNkdkDir,
            rule: childCollection.fileItemRule,
          }),
          rule: childCollection.fileItemRule,
        })
        const childXmlObj = exportMetadataItemToXML({
          context: childContext,
          data: childModelForXML as never,
          referenceData: childReferenceModel as never,
          rule: withFileItemCollectionReferenceExportRules(childCollection.fileItemRule),
        })
        if (childXmlObj) {
          const childOutputPath = `${childXmlDir}.xml`
          await fs.promises.mkdir(dirname(childOutputPath), { recursive: true })
          await fs.promises.writeFile(childOutputPath, xmlExport(childXmlObj), "utf-8")
          xmlManifest?.addFile(childOutputPath)
        }
      }

      for (const [itemPropKey, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
        const syncFn = getTypeRule(itemPropRule.type, "syncExternalToXML")
        if (!syncFn) continue
        const externalSyncName = hasOwnDirs && isFileChildNameRule(itemPropRule) ? "" : syncName
        const externalSyncReferenceName = hasOwnDirs && isFileChildNameRule(itemPropRule) ? "" : syncReferenceName
        await syncFn({
          context,
          rule: itemPropRule,
          nkdkDir: childNkdkDir,
          xmlDir: childXmlDir,
          name: externalSyncName,
          referenceDir: childReferenceDir,
          referenceName: externalSyncReferenceName,
          propertyValue:
            itemPropRule.type === "ChildFormNames"
              ? getExpectedFormNames({ rule: childCollection.itemRule, model: item.model })
              : item.model[itemPropKey],
          xmlManifest,
          itemName: hasOwnDirs ? undefined : item.name,
          currentXMLDir: externalSyncName === "" ? childXMLRelativeDir : undefined,
        })
        await preserveReferenceChildNameFilesToXML({
          rule: itemPropRule,
          nkdkDir: childNkdkDir,
          xmlDir: childXmlDir,
          referenceDir: childReferenceDir,
          xmlManifest,
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
        xmlRelativeDir: childXMLRelativeDir,
      })
    }
  }
}

function normalizeXMLPath(value: string): string {
  return value.split(/[\\/]+/).filter(Boolean).join("/")
}

function getExpectedFormNames(params: { rule: MetadataItemRule; model: Record<string, unknown> }): string[] {
  const names = new Set<string>()

  for (const [key, propRule] of Object.entries(params.rule.properties)) {
    const value = params.model[key]
    if (propRule.type === "ChildFormNames" && Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) names.add(item)
      }
      continue
    }

    if (!isLocalFormReferenceRule(propRule)) continue
    if (typeof value === "string" && value.length > 0) names.add(getLocalFormName(value))
  }

  return Array.from(names)
}

function isLocalFormReferenceRule(propRule: PropertyRule): boolean {
  if (propRule.metadataTarget?.kind === "localChild" && propRule.metadataTarget.childKind === "Form") return true
  return propRule.referenceScope?.target === "this" && propRule.referenceScope.kind === "Form"
}

function getLocalFormName(value: string): string {
  const marker = ".Form."
  const markerIndex = value.lastIndexOf(marker)
  return markerIndex === -1 ? value : value.slice(markerIndex + marker.length)
}

function addChildCollectionReferenceNames(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
}): Record<string, unknown> {
  return addFileChildCollectionReferenceNames(params)
}

function addFileChildCollectionReferenceNames(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
}): Record<string, unknown> {
  const result = { ...params.model }
  for (const childCollection of params.rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue
    const collectionModel = result[childCollection.propertyKey]
    const itemNames = normalizeFileItemCollectionItems(collectionModel).map((item) => item.name)

    if (itemNames.length === 0) continue

    result[childCollection.propertyKey] = itemNames
  }
  return result
}

async function addFileItemChildCollectionsFromYAML(params: {
  context: ConfigurationContextWithExportToXML
  rule: MetadataItemRule
  model: Record<string, unknown>
  nkdkDir: string
  parentName: string
  referenceDir?: string
  referenceName?: string
  referenceXmlPath?: string
}): Promise<void> {
  for (const childCollection of params.rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.nkdkDir) continue

    const folderNames = await listYAMLFileItemNames({
      nkdkDir: params.nkdkDir,
      childCollection,
      parentName: params.parentName,
    })
    if (folderNames.length === 0) {
      const inlineItems = normalizeFileItemCollectionItems(params.model[childCollection.propertyKey])
      if (inlineItems.length > 0) params.model[childCollection.propertyKey] = inlineItems.map((item) => item.model)
      continue
    }

    const referenceNames = readFileItemReferenceNamesFromXML({
      rule: params.rule,
      childCollection,
      referenceDir: params.referenceDir,
      referenceName: params.referenceName ?? params.parentName,
      referenceXmlPath: params.referenceXmlPath,
    })
    const orderedNames = orderFileItemNames({ currentNames: folderNames, referenceNames })
    const childModels: Record<string, unknown>[] = []

    for (const childName of orderedNames) {
      const childNkdkDir = join(
        params.nkdkDir,
        resolveChildCollectionDir(childCollection.nkdkDir, childName, params.parentName)
      )
      const childYamlPath = join(childNkdkDir, PROPERTIES_YAML)
      const childYamlContent = await fs.promises.readFile(childYamlPath, "utf-8")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childYaml = importFromYAML<any>(childYamlContent)
      const childContextWithFormDir = withImportFormDir(params.context, childNkdkDir)
      const importedChildModel = importMetadataItemFromYAML({
        context: childContextWithFormDir,
        yaml: childYaml,
        rule: childCollection.fileItemRule,
        name: childName,
      }) as Record<string, unknown> | undefined
      if (!importedChildModel) continue
      const childModel = { ...importedChildModel, name: childName }

      const childReferenceDir =
        params.referenceDir && childCollection.xmlDir
          ? join(params.referenceDir, resolveChildCollectionDir(childCollection.xmlDir, childName, params.referenceName))
          : undefined

      await addFileItemChildCollectionsFromYAML({
        context: childContextWithFormDir,
        rule: childCollection.fileItemRule,
        model: childModel,
        nkdkDir: childNkdkDir,
        parentName: childName,
        referenceDir: childReferenceDir,
        referenceName: childName,
        referenceXmlPath: childReferenceDir ? `${childReferenceDir}.xml` : undefined,
      })
      childModels.push(childModel)
    }

    params.model[childCollection.propertyKey] = childModels
  }
}

function withImportFormDir(
  context: ConfigurationContextWithExportToXML,
  formDir: string
): ConfigurationContextWithExportToXML {
  return {
    ...context,
    importFromYAML: {
      ...(context.importFromYAML ?? {}),
      formDir,
    },
  }
}

function readFileItemReferenceNamesFromXML(params: {
  rule: MetadataItemRule
  childCollection: NonNullable<MetadataItemRule["childCollections"]>[number]
  referenceDir?: string
  referenceName: string
  referenceXmlPath?: string
}): string[] | undefined {
  if (!params.referenceDir && !params.referenceXmlPath) return undefined
  const propertyRule = params.rule.properties[params.childCollection.propertyKey]
  if (!propertyRule) return undefined

  const referenceXmlPath = params.referenceXmlPath ?? join(params.referenceDir as string, `${params.referenceName}.xml`)
  if (!fs.existsSync(referenceXmlPath)) return undefined

  const container = getFileItemXMLRootContainer(params.rule)
  if (!container) return undefined

  const xmlContent = fs.readFileSync(referenceXmlPath, "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(xmlContent)
  const root = (parsed.MetaDataObject as Record<string, unknown> | undefined)?.[container]
  if (!root || typeof root !== "object") return undefined

  const xmlRootContainer = params.childCollection.fileItemRule
    ? getFileItemXMLRootContainer(params.childCollection.fileItemRule)
    : undefined
  const xmlKey = propertyRule.xml ?? xmlRootContainer ?? params.childCollection.propertyKey
  const xmlParents = propertyRule.xmlParents ?? ["ChildObjects"]
  const xmlValue = readXMLPath(root as Record<string, unknown>, [...xmlParents, xmlKey])
  if (xmlValue === undefined) return undefined

  return (Array.isArray(xmlValue) ? xmlValue : [xmlValue]).filter((value): value is string => typeof value === "string")
}

function withFileItemCollectionReferenceExportRules(rule: MetadataItemRule): MetadataItemRule {
  let properties: Record<string, PropertyRule> | undefined

  for (const childCollection of rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue

    const propertyRule = rule.properties[childCollection.propertyKey]
    if (!propertyRule) continue

    const xmlRootContainer = getFileItemXMLRootContainer(childCollection.fileItemRule)
    if (!xmlRootContainer) continue

    properties ??= { ...rule.properties }
    const { toXML: _toXML, fromXML: _fromXML, ...rest } = propertyRule
    properties[childCollection.propertyKey] = {
      ...rest,
      xml: propertyRule.xml ?? xmlRootContainer,
      xmlParents: propertyRule.xmlParents ?? ["ChildObjects"],
    } as PropertyRule
  }

  return properties ? ({ ...rule, properties } as MetadataItemRule) : rule
}

function readXMLPath(xml: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = xml
  for (const part of path) {
    if (!current || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function addReferenceChildNameProperties(params: {
  model: Record<string, unknown>
  referenceModel: Record<string, unknown> | undefined
  rule: MetadataItemRule
}): Record<string, unknown> {
  if (!params.referenceModel) return params.model

  const result = { ...params.model }
  for (const [key, propertyRule] of Object.entries(params.rule.properties)) {
    if (!isFileChildNameRule(propertyRule)) continue
    if (Array.isArray(result[key])) continue

    const referenceValue = params.referenceModel[key]
    if (!Array.isArray(referenceValue) || referenceValue.length === 0) continue
    result[key] = referenceValue
  }
  return result
}

async function addChildNameProperties(params: {
  model: Record<string, unknown>
  nkdkDir: string
  rule: MetadataItemRule
}): Promise<Record<string, unknown>> {
  const result = { ...params.model }

  for (const [key, propertyRule] of Object.entries(params.rule.properties)) {
    if (!isFileChildNameRule(propertyRule)) continue
    const folderName = getChildNameFolder(propertyRule)
    if (folderName === undefined) continue

    const childNamesDir = join(params.nkdkDir, folderName)
    if (!fs.existsSync(childNamesDir)) continue
    result[key] = await listSubdirNames(childNamesDir)
  }

  return result
}

function isFileChildNameRule(rule: PropertyRule): boolean {
  return (
    (rule.type === "ChildFormNames" && rule.xml === "Form") ||
    (rule.type === "ChildTemplateNames" && rule.xml === "Template")
  )
}

function getChildNameFolder(rule: PropertyRule): string | undefined {
  const folderName = (rule as { folderName?: unknown }).folderName
  return typeof folderName === "string" ? folderName : undefined
}

async function preserveReferenceChildNameFilesToXML(params: {
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  referenceDir?: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  if (!params.referenceDir) return
  if (!isFileChildNameRule(params.rule)) return

  const nkdkFolderName = getChildNameFolder(params.rule)
  if (nkdkFolderName && fs.existsSync(join(params.nkdkDir, nkdkFolderName))) return

  const xmlFolderName = params.rule.type === "ChildFormNames" ? "Forms" : "Templates"
  const referencePath = join(params.referenceDir, xmlFolderName)
  if (!fs.existsSync(referencePath)) return

  const outputPath = join(params.xmlDir, xmlFolderName)
  await fs.promises.cp(referencePath, outputPath, { recursive: true })
  await addDirectoryFilesToManifest(outputPath, params.xmlManifest)
}

async function addDirectoryFilesToManifest(
  dir: string,
  xmlManifest?: XmlWriteManifest
): Promise<void> {
  if (!xmlManifest || !fs.existsSync(dir)) return

  const entries = await fs.promises.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      await addDirectoryFilesToManifest(path, xmlManifest)
    } else if (entry.isFile()) {
      xmlManifest.addFile(path)
    }
  }
}

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
    const refParsed = importContentFromXML<Record<string, unknown>>(refContent, { preserveXsiNil: true })
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
