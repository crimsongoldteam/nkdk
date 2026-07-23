import fs from "fs"
import { basename, dirname, join, posix, relative, sep } from "path"
import { getChildContextToXML } from "../../context/helpers"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "../../context/types"
import { convertMetadataItemFromYAMLToXML } from "../metadataItem/fromYAMLToXML"
import { callAtomicFromYAML, callAtomicToXML } from "../property/fromYAMLToXML"
import type { YAMLToXMLExternalWrite } from "../property/fromYAMLToXMLTypes"
import { getTypeRule } from "../property/typeRuleRegistry"
import type { FileChildNamesDescriptor } from "../property/fn"
import { metadataTargetOwnerFromRule } from "../property/metadataTargetString"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import type { XmlWriteManifest } from "../xmlWriteManifest"
import { xmlExport } from "../../../xml/export/exporter"
import { importContentFromXML } from "../../../xml/import/importer"
import { importFromYAML } from "../../../yaml/import"
import type { PreparedYamlFile } from "../../project/preparedYamlProject"
import { bindDeferredObjectValues, type DeferredObjectValue } from "../property/deferredObjectValues"
import { withYAMLImportDiagnostics } from "../yamlImportError"
import {
  getFileItemXMLRootContainer,
  listYAMLFileItemNames,
  normalizeFileItemCollectionItems,
  orderFileItemNames,
  resolveChildCollectionDir,
} from "./fileItemChildCollections"

const PROPERTIES_YAML = "Свойства.yaml"

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
  useReferenceXML?: false
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
  externalDirsContainCurrentItem?: true
  currentXMLDir?: string
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

export const prepareAppliedObjectOwnerXML = (params: {
  rule: MetadataItemRule
  context: ConfigurationContextWithExportToXML
  name: string
  preparedYamlFile: PreparedYamlFile
  referenceXML?: Record<string, unknown>
  fileChildNames?: { forms?: readonly string[]; templates?: readonly string[] }
  profile?: import("../property/fromYAMLToXMLTypes").YAMLToXMLProfile
}): {
  xml: Record<string, unknown>
  deferred: readonly DeferredObjectValue[]
  rootRule: MetadataItemRule
} => {
  const yamlObj = params.preparedYamlFile.data
  if (yamlObj === undefined)
    throw new Error(`Подготовленные YAML-данные отсутствуют: ${params.preparedYamlFile.projectPath}`)

  const contextWithProjectDir: ConfigurationContextWithExportToXML = {
    ...params.context,
    importFromYAML: {
      ...(params.context.importFromYAML ?? {}),
      projectDir: params.context.importFromYAML?.projectDir ?? dirname(dirname(params.preparedYamlFile.filePath)),
    },
  }
  const contextWithFileDiagnostics = withYAMLImportDiagnostics(contextWithProjectDir, {
    sourceFile: params.preparedYamlFile.filePath,
    objectPath: `${params.rule.itemTypePrefix ?? params.rule.itemType}.${params.name}`,
  }) as ConfigurationContextWithExportToXML
  const contextWithFormDir = withImportFormDir(contextWithFileDiagnostics, dirname(params.preparedYamlFile.filePath))
  const contextWithForms: ConfigurationContextWithExportToXML = {
    ...contextWithFormDir,
    exportToXML: {
      ...contextWithFormDir.exportToXML,
      context: {
        ...contextWithFormDir.exportToXML.context,
        forms: [...(params.fileChildNames?.forms ?? [])],
        templates: [...(params.fileChildNames?.templates ?? [])],
        parentName: params.name,
        metadataForNumbering: contextWithFormDir.exportToXML.context?.metadataForNumbering ?? [],
      },
    },
  }

  const converted = convertMetadataItemFromYAMLToXML({
    context: contextWithForms,
    rule: withFileItemCollectionReferenceExportRules(params.rule),
    yaml: yamlObj,
    name: params.name,
    outputs: [{ key: "owner", referenceXML: params.referenceXML }],
    profile: params.profile,
    rulePath: [params.rule.itemType],
  })
  const xmlObj = converted.outputs.get("owner")
  if (xmlObj === undefined) throw new Error("Преобразование объекта не сформировало owner XML")
  return {
    xml: xmlObj,
    deferred: bindDeferredObjectValues(xmlObj, converted.deferredByOutput.get("owner") ?? []),
    rootRule: params.rule,
  }
}

export const writePreparedAppliedObjectOwnerToXML = async (params: {
  rule: MetadataItemRule
  context: ConfigurationContextWithExportToXML
  name: string
  outputPath: string
  preparedYamlFile: PreparedYamlFile
  referenceXML?: Record<string, unknown>
  fileChildNames?: { forms?: readonly string[]; templates?: readonly string[] }
  profile?: import("../property/fromYAMLToXMLTypes").YAMLToXMLProfile
}): Promise<void> => {
  const prepared = prepareAppliedObjectOwnerXML(params)
  await fs.promises.mkdir(dirname(params.outputPath), { recursive: true })
  await fs.promises.writeFile(params.outputPath, xmlExport(prepared.xml), "utf-8")
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

  {
    const fileChildNames = await collectFileChildNames({ rule, inputDir, name })
    const fileItemChildren = await collectDirectFileItemChildren({
      rule,
      yaml: yamlObj,
      nkdkDir,
      outputDir: externalOutputDir,
      referenceDir: externalReferenceDir,
      parentName: name,
      referenceName,
      referenceXmlPath,
      currentXMLDir: params.currentXMLDir,
    })
    const propertyValues = new Map<string, unknown>()
    for (const [propertyKey, names] of Object.entries(fileChildNames)) {
      const propertyRule = rule.properties[propertyKey]
      const descriptor = propertyRule === undefined ? undefined : getFileChildNamesDescriptor(propertyRule)
      const expectedNames =
        descriptor?.expectedNames({
          rule,
          yaml: asRecord(yamlObj) ?? {},
          propertyValue: names,
        }) ?? names
      propertyValues.set(propertyKey, [
        ...new Set([
          ...expectedNames,
          ...collectTargetedFileChildNames({ rule, yaml: yamlObj, memberKind: descriptor?.xmlItemName }),
        ]),
      ])
    }
    for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
      if (propertyValues.has(propertyKey)) continue
      const descriptor = getFileChildNamesDescriptor(propertyRule)
      const targetedNames = collectTargetedFileChildNames({
        rule,
        yaml: yamlObj,
        memberKind: descriptor?.xmlItemName,
      })
      if (targetedNames.length > 0) propertyValues.set(propertyKey, targetedNames)
    }
    for (const childCollection of rule.childCollections ?? []) {
      if (childCollection.fileItemRule === undefined) continue
      propertyValues.set(
        childCollection.propertyKey,
        fileItemChildren.filter((child) => child.propertyKey === childCollection.propertyKey).map((child) => child.name)
      )
    }
    const contextWithForms = withFileChildNamesContext({ context: contextWithFormDir, name, fileChildNames })
    const contextWithOwner = getChildContextToXML({
      context: withImportMetadataTargetOwner(contextWithForms, rule, name),
      itemType: rule.itemType,
      path: `${rule.itemType}.${name}`,
      name,
      externalMetadata: rule.externalMetadata,
    })
    const referenceXML =
      params.useReferenceXML === false || referenceXmlPath === undefined || !fs.existsSync(referenceXmlPath)
        ? undefined
        : importContentFromXML<Record<string, unknown>>(await fs.promises.readFile(referenceXmlPath, "utf8"), {
            preserveXsiNil: true,
            preserveEmptyElements: true,
          })
    const converted = convertMetadataItemFromYAMLToXML({
      context: contextWithOwner,
      yaml: yamlObj,
      rule: withFileItemCollectionReferenceExportRules(rule),
      name,
      outputs: [{ key: "owner", referenceXML }],
      propertyValues,
      externalWriteFactory: ({
        propertyKey,
        propertyRule,
        source,
        referenceValue,
        name: itemName,
      }): readonly YAMLToXMLExternalWrite[] => {
        const nestedRule = getTypeRule(propertyRule.type, "yamlToXMLNestedRule")
        const syncFn = getTypeRule(propertyRule.type, "syncExternalToXML")
        if (syncFn !== undefined && nestedRule?.kind !== "externalFile") {
          const descriptor = getFileChildNamesDescriptor(propertyRule)
          const syncUsesItemDir = descriptor?.useOwnerDirectoryForExternalSync === true
          const syncXmlDir =
            params.externalDirsContainCurrentItem === true
              ? externalOutputDir
              : syncUsesItemDir
                ? outputDir
                : externalOutputDir
          const syncReferenceDir =
            params.externalDirsContainCurrentItem === true
              ? externalReferenceDir
              : syncUsesItemDir
                ? referenceDir
                : externalReferenceDir
          const syncName = params.externalDirsContainCurrentItem === true ? "" : name
          const syncReferenceName = params.externalDirsContainCurrentItem === true ? "" : referenceName
          if (
            params.onlyExternalXmlPath !== undefined &&
            !matchesExternalXMLPath({
              outputDir,
              syncXmlDir,
              propRule: propertyRule,
              name,
              expectedXmlPath: params.onlyExternalXmlPath,
            })
          ) {
            return []
          }
          const propertyValue = descriptor
            ? descriptor.expectedNames({
                rule,
                yaml: asRecord(yamlObj) ?? {},
                propertyValue: propertyValues.get(propertyKey) ?? source.raw(propertyKey),
              })
            : source.raw(propertyKey)
          return [
            {
              kind: "handler",
              run: async () => {
                await syncFn({
                  context: contextWithOwner,
                  rule: propertyRule,
                  nkdkDir,
                  xmlDir: syncXmlDir,
                  name: syncName,
                  referenceDir: syncReferenceDir,
                  referenceName: syncReferenceName,
                  referencePropertyValue: referenceValue,
                  propertyValue,
                  xmlManifest: params.xmlManifest,
                  itemName: itemName === name ? undefined : itemName,
                  currentXMLDir: params.externalDirsContainCurrentItem === true ? params.currentXMLDir : undefined,
                })
                await preserveReferenceChildNameFilesToXML({
                  rule: propertyRule,
                  nkdkDir,
                  xmlDir: syncXmlDir,
                  referenceDir: syncReferenceDir,
                  xmlManifest: params.xmlManifest,
                })
              },
            },
          ]
        }
        if (propertyRule.filePath === undefined) return []
        const rawReferencePath =
          externalReferenceDir === undefined
            ? undefined
            : resolveReferenceFilePath({
                externalReferenceDir,
                filePath: propertyRule.filePath,
                referenceName,
                hasExplicitExternalReferenceDir,
              })
        const rawReferenceXML =
          rawReferencePath !== undefined && fs.existsSync(rawReferencePath)
            ? importContentFromXML<Record<string, unknown>>(fs.readFileSync(rawReferencePath, "utf8"), {
                preserveXsiNil: true,
                preserveEmptyElements: true,
              })
            : undefined
        const importFromXML = getTypeRule(propertyRule.type, "importFromXML")
        const referencePropertyValue =
          rawReferenceXML === undefined || importFromXML === undefined
            ? undefined
            : importFromXML(contextFromXML, propertyRule, rawReferenceXML)
        if (!source.has(propertyKey) && propertyRule.exportReferenceFileOnMissingValue !== true) return []
        if (nestedRule?.kind === "externalFile") {
          const xml = nestedRule.convert({
            context: contextWithOwner,
            yaml: source.raw(propertyKey),
            name,
            referenceXML: rawReferenceXML,
          })
          const targetPath =
            (rawReferencePath !== undefined && fs.existsSync(rawReferencePath)) || hasExplicitExternalOutputDir
              ? join(externalOutputDir, propertyRule.filePath)
              : join(externalOutputDir, name, propertyRule.filePath)
          const writes: YAMLToXMLExternalWrite[] = [{ kind: "xml", targetPath, value: xml }]
          if (syncFn !== undefined) {
            writes.push({
              kind: "handler",
              run: async () => {
                await syncFn({
                  context: contextWithOwner,
                  rule: propertyRule,
                  nkdkDir,
                  xmlDir: externalOutputDir,
                  name,
                  referenceDir: externalReferenceDir,
                  referenceName,
                  referencePropertyValue,
                  propertyValue: source.raw(propertyKey),
                  xmlManifest: params.xmlManifest,
                  itemName: itemName === name ? undefined : itemName,
                  currentXMLDir: params.currentXMLDir,
                })
              },
            })
          }
          return writes
        }
        if (nestedRule?.kind === "item") {
          const convertedFile = convertMetadataItemFromYAMLToXML({
            context: contextWithOwner,
            yaml: source.raw(propertyKey),
            rule: nestedRule.itemRule,
            outputs: [{ key: "file", referenceXML: rawReferenceXML }],
            ownerYAML: { itemType: rule.itemType },
          }).outputs.get("file")
          if (convertedFile === undefined) return []
          const targetPath =
            (rawReferencePath !== undefined && fs.existsSync(rawReferencePath)) || hasExplicitExternalOutputDir
              ? join(externalOutputDir, propertyRule.filePath)
              : join(externalOutputDir, name, propertyRule.filePath)
          return [{ kind: "xml", targetPath, value: convertedFile }]
        }
        if (getTypeRule(propertyRule.type, "exportToXML") === undefined) return []
        const value = callAtomicFromYAML({
          context: contextWithOwner,
          rule: propertyRule,
          value: source.raw(propertyKey),
          referenceValue: referencePropertyValue,
          yaml: yamlObj,
          name,
          owner: metadataTargetOwnerFromRule({ itemRule: rule, name, context: contextWithOwner }),
        })
        if (value === undefined) return []
        const xml = callAtomicToXML({
          context: contextWithOwner,
          rule: propertyRule,
          value,
          referenceValue: referencePropertyValue,
          source,
        })
        const xmlRecord = asRecord(xml)
        if (xmlRecord === undefined) return []
        const targetPath =
          (rawReferencePath !== undefined && fs.existsSync(rawReferencePath)) || hasExplicitExternalOutputDir
            ? join(externalOutputDir, propertyRule.filePath)
            : join(externalOutputDir, name, propertyRule.filePath)
        return [{ kind: "xml", targetPath, value: xmlRecord }]
      },
    })
    const xmlObj = converted.outputs.get("owner")
    if (params.onlyExternalXmlPath === undefined) {
      if (xmlObj === undefined) return
      await fs.promises.mkdir(outputDir, { recursive: true })
      const outputPath = join(outputDir, `${name}.xml`)
      await fs.promises.writeFile(outputPath, xmlExport(xmlObj), "utf8")
      params.xmlManifest?.addFile(outputPath)
      if (params.onlyOwnerXML) return
    }
    for (const write of converted.externalWrites) {
      if (write.kind === "handler") await write.run()
      if (write.kind === "xml") {
        await fs.promises.mkdir(dirname(write.targetPath), { recursive: true })
        await fs.promises.writeFile(write.targetPath, xmlExport(write.value), "utf8")
        params.xmlManifest?.addFile(write.targetPath)
      }
    }
    for (const child of fileItemChildren) {
      await syncAppliedObjectToXMLInternal({
        rule: child.rule,
        context: contextWithOwner,
        inputDir: dirname(child.nkdkDir),
        name: child.name,
        outputDir: dirname(child.xmlPath),
        externalOutputDir: child.xmlPath.slice(0, -".xml".length),
        referenceDir: child.referenceXmlPath === undefined ? undefined : dirname(child.referenceXmlPath),
        externalReferenceDir: child.referenceXmlPath?.slice(0, -".xml".length),
        referenceName: child.name,
        preparedYamlFile: {
          projectPath: relative(dirname(inputDir), child.yamlPath),
          filePath: child.yamlPath,
          role: "properties",
          owner: { dir: dirname(child.yamlPath), name: child.name },
          data: child.yaml,
          syntaxDiagnostics: [],
        },
        xmlManifest: params.xmlManifest,
        onlyExternalXmlPath: params.onlyExternalXmlPath,
        externalDirsContainCurrentItem: true,
        currentXMLDir: child.currentXMLDir,
      })
    }
    return
  }
}

function collectTargetedFileChildNames(params: {
  rule: MetadataItemRule
  yaml: unknown
  memberKind: string | undefined
}): string[] {
  if (params.memberKind === undefined) return []
  const yaml = asRecord(params.yaml)
  if (yaml === undefined) return []
  const result = new Set<string>()
  for (const propertyRule of Object.values(params.rule.properties)) {
    const targetsKind =
      propertyRule.metadataTarget?.kind === "member" &&
      propertyRule.metadataTarget.memberKinds?.includes(params.memberKind as never)
    const scopeTargetsKind =
      propertyRule.referenceScope?.target === "this" && propertyRule.referenceScope.kind === params.memberKind
    if (!targetsKind && !scopeTargetsKind) continue
    const value = propertyRule.yaml === undefined ? undefined : yaml[propertyRule.yaml]
    if (typeof value !== "string" || value.length === 0) continue
    result.add(value.split(".").at(-1)!)
  }
  return [...result]
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

function normalizeXMLPath(value: string): string {
  return value
    .split(/[\\/]+/)
    .filter(Boolean)
    .join("/")
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

function withFileChildNamesContext(params: {
  context: ConfigurationContextWithExportToXML
  name: string
  fileChildNames: { forms?: readonly string[]; templates?: readonly string[] }
}): ConfigurationContextWithExportToXML {
  return {
    ...params.context,
    exportToXML: {
      ...params.context.exportToXML,
      context: {
        ...params.context.exportToXML.context,
        forms: [...(params.fileChildNames.forms ?? [])],
        templates: [...(params.fileChildNames.templates ?? [])],
        parentName: params.name,
        metadataForNumbering: params.context.exportToXML.context?.metadataForNumbering ?? [],
      },
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

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
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

const listSubdirNames = async (dir: string): Promise<string[]> => {
  if (!fs.existsSync(dir)) return []
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

interface DirectFileItemChild {
  readonly propertyKey: string
  readonly rule: MetadataItemRule
  readonly name: string
  readonly yaml: unknown
  readonly yamlPath: string
  readonly nkdkDir: string
  readonly xmlPath: string
  readonly referenceXmlPath?: string
  readonly currentXMLDir: string
}

async function collectDirectFileItemChildren(params: {
  rule: MetadataItemRule
  yaml: unknown
  nkdkDir: string
  outputDir: string
  referenceDir?: string
  parentName: string
  referenceName: string
  referenceXmlPath?: string
  currentXMLDir?: string
}): Promise<DirectFileItemChild[]> {
  const yamlRecord = asRecord(params.yaml) ?? {}
  const result: DirectFileItemChild[] = []

  for (const childCollection of params.rule.childCollections ?? []) {
    if (
      childCollection.fileItemRule === undefined ||
      childCollection.nkdkDir === undefined ||
      childCollection.xmlDir === undefined
    ) {
      continue
    }

    const folderNames = await listYAMLFileItemNames({
      nkdkDir: params.nkdkDir,
      childCollection,
      parentName: params.parentName,
    })
    const propertyRule = params.rule.properties[childCollection.propertyKey]
    const yamlKey = propertyRule?.yaml
    const inlineItems = normalizeFileItemCollectionItems(typeof yamlKey === "string" ? yamlRecord[yamlKey] : undefined)
    const inlineByName = new Map(inlineItems.map((item) => [item.name, item.model]))
    const currentNames = folderNames.length > 0 ? folderNames : inlineItems.map((item) => item.name)
    const referenceNames = readFileItemReferenceNamesFromXML({
      rule: params.rule,
      childCollection,
      referenceDir: params.referenceDir,
      referenceName: params.referenceName,
      referenceXmlPath: params.referenceXmlPath,
    })

    for (const childName of orderFileItemNames({ currentNames, referenceNames })) {
      const childNkdkDir = join(
        params.nkdkDir,
        resolveChildCollectionDir(childCollection.nkdkDir, childName, params.parentName)
      )
      const yamlPath = join(childNkdkDir, PROPERTIES_YAML)
      const yaml =
        folderNames.length > 0
          ? importFromYAML<unknown>(await fs.promises.readFile(yamlPath, "utf8"))
          : inlineByName.get(childName)
      const childXmlPath = join(
        params.outputDir,
        `${resolveChildCollectionDir(childCollection.xmlDir, childName, params.parentName)}.xml`
      )
      const referenceXmlPath =
        params.referenceDir === undefined
          ? undefined
          : join(
              params.referenceDir,
              `${resolveChildCollectionDir(childCollection.xmlDir, childName, params.referenceName)}.xml`
            )
      const currentXMLDir = posix.join(
        params.currentXMLDir ?? "",
        normalizeXMLPath(resolveChildCollectionDir(childCollection.xmlDir, childName, params.parentName))
      )

      result.push({
        propertyKey: childCollection.propertyKey,
        rule: childCollection.fileItemRule,
        name: childName,
        yaml,
        yamlPath,
        nkdkDir: childNkdkDir,
        xmlPath: childXmlPath,
        referenceXmlPath,
        currentXMLDir,
      })
    }
  }

  return result
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
    const childDir = join(params.inputDir, params.name, descriptor.folderName)
    if (!fs.existsSync(childDir)) continue
    result[propertyName] = await listSubdirNames(childDir)
  }
  return result
}
