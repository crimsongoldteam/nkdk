import fs from "fs"
import { basename, dirname, join, posix, relative, sep } from "path"
import { getChildContextToXML } from "../../context/helpers"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "../../context/types"
import { exportMetadataItemToXML, importMetadataItemFromXML, importMetadataItemFromYAML } from ".."
import { getTypeRule } from "../property/typeRuleRegistry"
import { importPropertyFromXML } from "../property/fromXML"
import { exportPropertyToXML } from "../property/toXML"
import type { FileChildNamesDescriptor } from "../property/fn"
import { metadataTargetOwnerFromRule } from "../property/metadataTargetString"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import type { XmlWriteManifest } from "../xmlWriteManifest"
import { xmlExport } from "../../../xml/export/exporter"
import { importContentFromXML } from "../../../xml/import/importer"
import { importFromYAML } from "../../../yaml/import"
import type { PreparedYamlFile } from "../../project/preparedYamlProject"
import { withYAMLImportDiagnostics } from "../yamlImportError"
import {
  getFileItemXMLRootContainer,
  listYAMLFileItemNames,
  normalizeFileItemCollectionItems,
  orderFileItemNames,
  resolveChildCollectionDir,
} from "./fileItemChildCollections"

const PROPERTIES_YAML = "Свойства.yaml"

export type ReferenceModelRemapper = (params: {
  rule: MetadataItemRule
  currentModel: Record<string, unknown>
  referenceModel: Record<string, unknown> | undefined
}) => Record<string, unknown> | undefined

export interface SyncAppliedObjectToXMLParams {
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
  preparedYamlFile?: PreparedYamlFile
}

export type AppliedObjectXmlAreaRequest =
  | { kind: "owner" }
  | { kind: "all" }
  | { kind: "externalFile"; xmlPath: string }

type InternalSyncAppliedObjectToXMLParams = SyncAppliedObjectToXMLParams & {
  onlyOwnerXML?: true
  onlyExternalXmlPath?: string
}

export const syncAppliedObjectAreaToXML = async (
  params: SyncAppliedObjectToXMLParams & { area: AppliedObjectXmlAreaRequest }
): Promise<void> => {
  const { area, ...rest } = params
  return syncAppliedObjectToXMLInternal({
    ...rest,
    ...(area.kind === "owner" ? { onlyOwnerXML: true } : {}),
    ...(area.kind === "externalFile" ? { onlyExternalXmlPath: area.xmlPath } : {}),
  })
}

export const syncAppliedObjectToXML = async (params: SyncAppliedObjectToXMLParams): Promise<void> => {
  return syncAppliedObjectToXMLInternal(params)
}

const syncAppliedObjectToXMLInternal = async (params: InternalSyncAppliedObjectToXMLParams): Promise<void> => {
  const { rule, context, inputDir, name, outputDir } = params
  const referenceDir = params.referenceDir
  const externalOutputDir = params.externalOutputDir ?? outputDir
  const externalReferenceDir = params.externalReferenceDir ?? referenceDir
  const hasExplicitExternalOutputDir = params.externalOutputDir !== undefined
  const hasExplicitExternalReferenceDir = params.externalReferenceDir !== undefined
  const nkdkDir = join(inputDir, name)

  const yamlPath = join(inputDir, name, PROPERTIES_YAML)
  const yamlObj =
    params.preparedYamlFile?.data ?? importFromYAML<unknown>(await fs.promises.readFile(yamlPath, "utf-8"))

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
  const contextWithProjectDir: ConfigurationContextWithExportToXML = {
    ...context,
    importFromYAML: {
      ...(context.importFromYAML ?? {}),
      projectDir: context.importFromYAML?.projectDir ?? dirname(inputDir),
    },
  }
  const contextWithFileDiagnostics = withYAMLImportDiagnostics(contextWithProjectDir, {
    sourceFile: yamlPath,
    objectPath: `${rule.itemTypePrefix ?? rule.itemType}.${name}`,
  }) as ConfigurationContextWithExportToXML
  const contextWithFormDir = withImportFormDir(contextWithFileDiagnostics, nkdkDir)
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
    referenceXmlPath,
  })

  const fileChildNames = await collectFileChildNames({ rule, inputDir, name })

  const contextWithForms: ConfigurationContextWithExportToXML = {
    ...contextWithFormDir,
    exportToXML: {
      ...contextWithFormDir.exportToXML,
      context: {
        ...contextWithFormDir.exportToXML.context,
        forms: fileChildNames.forms ?? [],
        templates: fileChildNames.templates ?? [],
        parentName: name,
        metadataForNumbering: contextWithFormDir.exportToXML.context?.metadataForNumbering ?? [],
      },
    },
  }
  const contextWithImportOwner = withImportMetadataTargetOwner(contextWithForms, rule, name)
  const contextWithOwner = getChildContextToXML({
    context: contextWithImportOwner,
    itemType: rule.itemType,
    path: `${rule.itemType}.${name}`,
    name,
    externalMetadata: rule.externalMetadata,
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

  if (!xmlObj && !params.onlyExternalXmlPath) return

  if (!params.onlyExternalXmlPath && xmlObj) {
    await fs.promises.mkdir(outputDir, { recursive: true })
    const outputPath = join(outputDir, `${name}.xml`)
    await fs.promises.writeFile(outputPath, xmlExport(xmlObj), "utf-8")
    params.xmlManifest?.addFile(outputPath)
    if (params.onlyOwnerXML) return
  }

  // Обработчики внешних файлов на уровне объекта (Help, Module, Template со статическими путями)
  for (const [key, propRule] of Object.entries(rule.properties)) {
    const syncFn = getTypeRule(propRule.type, "syncExternalToXML")
    if (!syncFn) continue
    const fileChildDescriptor = getFileChildNamesDescriptor(propRule)
    const syncUsesItemDir = fileChildDescriptor?.useOwnerDirectoryForExternalSync === true
    const syncXmlDir = syncUsesItemDir ? outputDir : externalOutputDir
    const syncReferenceDir = syncUsesItemDir ? referenceDir : externalReferenceDir
    if (
      params.onlyExternalXmlPath &&
      !matchesExternalXMLPath({
        outputDir,
        syncXmlDir,
        propRule,
        name,
        expectedXmlPath: params.onlyExternalXmlPath,
      })
    ) {
      continue
    }
    await syncFn({
      context: contextWithOwner,
      rule: propRule,
      nkdkDir,
      xmlDir: syncXmlDir,
      name,
      referenceDir: syncReferenceDir,
      referenceName,
      referencePropertyValue:
        referenceModel === undefined ? undefined : (referenceModel as Record<string, unknown>)[key],
      xmlManifest: params.xmlManifest,
      propertyValue: fileChildDescriptor
        ? fileChildDescriptor.expectedNames({
            rule,
            model: model as Record<string, unknown>,
            propertyValue: (model as Record<string, unknown>)[key],
          })
        : (model as Record<string, unknown>)[key],
    })
  }
  if (params.onlyExternalXmlPath) return

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

function matchesExternalXMLPath(params: {
  outputDir: string
  syncXmlDir: string
  propRule: PropertyRule
  name: string
  expectedXmlPath: string
}): boolean {
  const rawXmlPath = "xmlPath" in params.propRule ? params.propRule.xmlPath : undefined
  if (typeof rawXmlPath !== "string" && typeof rawXmlPath !== "function") return false

  const xmlRoot = dirname(params.outputDir)
  const resolvedXmlPath =
    typeof rawXmlPath === "function" ? rawXmlPath({ name: params.name, parentName: params.name }) : rawXmlPath
  const objectPrefix = `${params.name}/`
  const xmlPath =
    basename(params.syncXmlDir) === params.name && resolvedXmlPath.startsWith(objectPrefix)
      ? resolvedXmlPath.slice(objectPrefix.length)
      : resolvedXmlPath
  const relativePath = relative(xmlRoot, join(params.syncXmlDir, xmlPath)).split(sep).join("/")
  return relativePath === params.expectedXmlPath
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
        externalMetadata: rule.externalMetadata,
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

      const childRule = childCollection.fileItemRule ?? childCollection.itemRule
      const childItemContext = getChildContextToXML({
        context: childContext,
        itemType: childRule.itemType,
        path: `${childRule.itemType}.${item.name}`,
        name: item.name,
        externalMetadata: childRule.externalMetadata,
      })
      for (const [itemPropKey, itemPropRule] of Object.entries(childRule.properties)) {
        const syncFn = getTypeRule(itemPropRule.type, "syncExternalToXML")
        if (!syncFn) continue
        const fileChildDescriptor = getFileChildNamesDescriptor(itemPropRule)
        const externalSyncName =
          hasOwnDirs && fileChildDescriptor?.useOwnerDirectoryForExternalSync === true ? "" : syncName
        const externalSyncReferenceName =
          hasOwnDirs && fileChildDescriptor?.useOwnerDirectoryForExternalSync === true ? "" : syncReferenceName
        await syncFn({
          context: childItemContext,
          rule: itemPropRule,
          nkdkDir: childNkdkDir,
          xmlDir: childXmlDir,
          name: externalSyncName,
          referenceDir: childReferenceDir,
          referenceName: externalSyncReferenceName,
          propertyValue: fileChildDescriptor
            ? fileChildDescriptor.expectedNames({
                rule: childRule,
                model: item.model,
                propertyValue: item.model[itemPropKey],
              })
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
        rule: childRule,
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
  return value
    .split(/[\\/]+/)
    .filter(Boolean)
    .join("/")
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
  const contextWithCurrentOwner = withImportMetadataTargetOwner(params.context, params.rule, params.parentName)

  for (const childCollection of params.rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.nkdkDir) continue

    const folderNames = await listYAMLFileItemNames({
      nkdkDir: params.nkdkDir,
      childCollection,
      parentName: params.parentName,
    })
    if (folderNames.length === 0) {
      const inlineItems = normalizeFileItemCollectionItems(params.model[childCollection.propertyKey])
      if (inlineItems.length > 0) {
        const childRule = childCollection.fileItemRule ?? childCollection.itemRule
        const childModels: Record<string, unknown>[] = []
        for (const item of inlineItems) {
          const childNkdkDir = childCollection.nkdkDir
            ? join(params.nkdkDir, resolveChildCollectionDir(childCollection.nkdkDir, item.name, params.parentName))
            : params.nkdkDir
          const childContextWithFormDir = withImportFormDir(contextWithCurrentOwner, childNkdkDir, item.name)
          const importedChildModel = importMetadataItemFromYAML({
            context: childContextWithFormDir,
            yaml: item.model as never,
            rule: childRule,
            name: item.name,
          }) as Record<string, unknown> | undefined
          if (!importedChildModel) continue
          const childModel = { ...importedChildModel, name: item.name }
          await addFileItemChildCollectionsFromYAML({
            context: childContextWithFormDir,
            rule: childRule,
            model: childModel,
            nkdkDir: childNkdkDir,
            parentName: item.name,
            referenceDir:
              params.referenceDir && childCollection.xmlDir
                ? join(
                    params.referenceDir,
                    resolveChildCollectionDir(childCollection.xmlDir, item.name, params.referenceName)
                  )
                : params.referenceDir,
            referenceName: item.name,
          })
          childModels.push(childModel)
        }
        params.model[childCollection.propertyKey] = childModels
      }
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
      const childContextWithDiagnostics = withYAMLImportDiagnostics(contextWithCurrentOwner, {
        sourceFile: childYamlPath,
        objectPath: `${params.rule.itemType}.${params.parentName}.${childCollection.propertyKey}.${childName}`,
      }) as ConfigurationContextWithExportToXML
      const childContextWithFormDir = withImportFormDir(childContextWithDiagnostics, childNkdkDir, params.parentName)
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
          ? join(
              params.referenceDir,
              resolveChildCollectionDir(childCollection.xmlDir, childName, params.referenceName)
            )
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
  formDir: string,
  parentName?: string
): ConfigurationContextWithExportToXML {
  return {
    ...context,
    importFromYAML: {
      ...(context.importFromYAML ?? {}),
      formDir,
      parent: parentName ? { name: parentName } : context.importFromYAML?.parent,
    },
  }
}

function withImportMetadataTargetOwner(
  context: ConfigurationContextWithExportToXML,
  rule: MetadataItemRule,
  name: string
): ConfigurationContextWithExportToXML {
  const owner = metadataTargetOwnerFromRule({ itemRule: rule, name, context })
  return {
    ...context,
    importFromYAML: {
      ...context.importFromYAML,
      metadataTargetOwners: [
        ...(context.importFromYAML?.metadataTargetOwners ?? []),
        { itemType: rule.itemType, name, ...(owner ? { owner } : {}) },
      ],
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
    if (!getFileChildNamesDescriptor(propertyRule)) continue
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
    const descriptor = getFileChildNamesDescriptor(propertyRule)
    if (!descriptor) continue

    const childNamesDir = join(params.nkdkDir, descriptor.folderName)
    if (!fs.existsSync(childNamesDir)) continue
    result[key] = orderFileItemNames({
      currentNames: await listSubdirNames(childNamesDir),
      referenceNames: toStringArray(result[key]),
    })
  }

  return result
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const strings = value.filter((item): item is string => typeof item === "string" && item.length > 0)
  return strings.length > 0 ? strings : undefined
}

function getFileChildNamesDescriptor(rule: PropertyRule): FileChildNamesDescriptor | undefined {
  return getTypeRule(rule.type, "fileChildNamesDescriptor")?.({ propertyRule: rule })
}

async function preserveReferenceChildNameFilesToXML(params: {
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  referenceDir?: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  if (!params.referenceDir) return
  const descriptor = getFileChildNamesDescriptor(params.rule)
  if (!descriptor?.preserveReferenceXmlFolder) return

  if (fs.existsSync(join(params.nkdkDir, descriptor.folderName))) return

  const referencePath = join(params.referenceDir, descriptor.xmlFolderName)
  if (!fs.existsSync(referencePath)) return

  const outputPath = join(params.xmlDir, descriptor.xmlFolderName)
  await fs.promises.cp(referencePath, outputPath, { recursive: true })
  await addDirectoryFilesToManifest(outputPath, params.xmlManifest)
}

async function addDirectoryFilesToManifest(dir: string, xmlManifest?: XmlWriteManifest): Promise<void> {
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
  return importMetadataItemFromXML({ context, xml: parsed.MetaDataObject, rule }) ?? undefined
}

const listSubdirNames = async (dir: string): Promise<string[]> => {
  if (!fs.existsSync(dir)) return []
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

async function collectFileChildNames(params: {
  rule: MetadataItemRule
  inputDir: string
  name: string
}): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {}
  for (const [propertyName, propertyRule] of Object.entries(params.rule.properties)) {
    const descriptor = getFileChildNamesDescriptor(propertyRule)
    if (!descriptor) continue
    result[propertyName] = await listSubdirNames(join(params.inputDir, params.name, descriptor.folderName))
  }
  return result
}
