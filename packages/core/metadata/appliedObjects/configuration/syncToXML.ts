import fs from "fs"
import { dirname, join } from "path"
import { BatchTask, runBatch } from "../../../helpers/runBatch"
import type { ConfigurationContextFromXML } from "../../context/types"
import { ConfigurationContextWithExportToXML } from "../../context/types"
import { syncAppliedObjectToXML } from "../../orchestration/appliedObject/syncToXML"
import type { ReferenceModelRemapper } from "../../orchestration/appliedObject/syncToXML"
import { resolveXmlSyncAreaForProjectPath, type XmlSyncArea } from "../../orchestration/appliedObject/xmlAreas"
import {
  prepareMetadataMigrationChain,
  type MigrationChainInvalidResult,
  type MigrationPlanItem,
  type PreparedMetadataMigrationChain,
} from "../../operations"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { exportPropertyToXML } from "../../orchestration/property/toXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { discoverMetadataProjectResources, type MetadataProjectPropertiesYamlRef } from "../../project/resources"
import { xmlExport } from "../../../xml/export/exporter"
import {
  applyPendingMigrationFiles,
  collectStructuralStateFromXML,
  collectStructuralStateFromYAML,
  parseMigrationPath,
  readAppliedMigrationsState,
  readPendingMigrationEntries,
  type StructuralState,
  writeAppliedMigrationsState,
} from "./migrations"
import { remapReferenceModel } from "./migrations/referenceRemap"
import { pruneXmlByManifest, XmlSyncManifest } from "./migrations/xmlManifest"
import { createConfigDumpInfoExternalMetadataCollector } from "../configDumpInfo/externalMetadataCollector"
import { syncConfigDumpInfoToXML } from "../configDumpInfo/sync"
import { ConfigurationSyncResult } from "./convertFromXML"
import { buildConfigurationChildObjects, readConfigurationChildObjectsFromXML } from "./childObjects"
import {
  CONFIGURATION_XML_FILE,
  CONFIGURATION_YAML_FILE,
  readConfigurationFromXML,
  readConfigurationFromYAML,
  writeConfigurationToXML,
} from "./rootIO"
import { MetadataConfigurationRules } from "./rules"
import { TopLevelMetadataItemRules } from "./topLevelRules"

// TODO: вынести в настройки расширения
const IO_CONCURRENCY = 16
const ROOT_EXTERNAL_XML_DIR = "Ext"
const LEGACY_ROOT_EXTERNAL_XML_DIR = "ext"
const toError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)))

function discoverTopLevelPropertiesResources(inputDir: string): MetadataProjectPropertiesYamlRef[] {
  return discoverMetadataProjectResources(inputDir).filter(
    (resource): resource is MetadataProjectPropertiesYamlRef =>
      resource.kind === "yaml" &&
      resource.role === "properties" &&
      resource.nesting.length === 0 &&
      resource.owner.spec.rule.xmlDir !== undefined &&
      resource.owner.spec.rule.itemTypePrefix !== undefined
  )
}

export type ConfigurationXmlMigrationPlanResult =
  | { ok: true; migrationsToApply: MigrationPlanItem[] }
  | MigrationChainInvalidResult

export type PreparedConfigurationXmlMigrationChain = PreparedMetadataMigrationChain & {
  yamlState: StructuralState
  migrationState: StructuralState
}

export async function planConfigurationToXMLMigrations(params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<ConfigurationXmlMigrationPlanResult> {
  const migrationChain = await prepareConfigurationXmlMigrationChain(params)
  if (!migrationChain.ok) return migrationChain

  return {
    ok: true,
    migrationsToApply: migrationChain.migrationsToApply,
  }
}

export async function planSyncToXml(params: {
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<{ ok: true; mode: "plan"; migrationsToApply: MigrationPlanItem[] } | MigrationChainInvalidResult> {
  const result = await planConfigurationToXMLMigrations({
    context: defaultConfigurationToXmlContext(),
    inputDir: params.inputDir,
    outputDir: params.outputDir,
    referenceDir: params.referenceDir,
  })
  if (!result.ok) return result
  return { ok: true, mode: "plan", migrationsToApply: result.migrationsToApply }
}

function defaultConfigurationToXmlContext(): ConfigurationContextWithExportToXML {
  return {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20",
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
      },
    },
  }
}

export async function prepareConfigurationXmlMigrationChain(params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
  useOutputAsReference?: boolean
}): Promise<PreparedConfigurationXmlMigrationChain | MigrationChainInvalidResult> {
  const referenceDir = params.referenceDir ?? (params.useOutputAsReference ? params.outputDir : undefined)
  const contextFromXML: ConfigurationContextFromXML = {
    fromXML: { forReference: true },
    defaultLanguage: params.context.defaultLanguage,
    version: params.context.version,
  }
  const referenceState = referenceDir
    ? await collectStructuralStateFromXML({ xmlDir: referenceDir, context: contextFromXML })
    : { nodes: new Map() }
  const yamlState = await collectStructuralStateFromYAML({ yamlDir: params.inputDir, context: params.context })

  const prepared = prepareMetadataMigrationChain({
    yamlDir: params.inputDir,
    xmlDir: params.outputDir,
    referencePaths: [...referenceState.nodes.keys()],
    yamlPaths: [...yamlState.nodes.keys()],
    xmlAreaByMigrationPath: resolveXmlAreaForMigrationPath,
  })
  if (!prepared.ok) return prepared

  const appliedState = readAppliedMigrationsState(params.outputDir)
  const pending = readPendingMigrationEntries(params.inputDir, appliedState)
  const migrationState = applyPendingMigrationFiles(referenceState, pending).state

  return { ...prepared, yamlState, migrationState }
}

export const syncConfigurationToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<ConfigurationSyncResult> => {
  const { context, inputDir, outputDir } = params
  const referenceDir = params.referenceDir

  if (!fs.existsSync(inputDir)) {
    return {
      succeeded: 0,
      failed: [{ kind: "configuration", name: inputDir, error: new Error(`YAML-каталог не найден: ${inputDir}`) }],
    }
  }

  const migrationChain = await prepareConfigurationXmlMigrationChain({ context, inputDir, outputDir, referenceDir })
  if (!migrationChain.ok) {
    return {
      succeeded: 0,
      failed: [
        {
          kind: "migration",
          name: "Миграции",
          error: new Error(JSON.stringify(migrationChain)),
        },
      ],
      migrationChain,
    }
  }
  const configDumpInfo = context.exportToXML.configDumpInfo
  const syncContext: ConfigurationContextWithExportToXML = {
    ...context,
    importFromYAML: {
      ...(context.importFromYAML ?? {}),
      projectDir: inputDir,
    },
    exportToXML: {
      ...context.exportToXML,
      configDumpInfo,
      externalMetadataCollector:
        context.exportToXML.externalMetadataCollector ?? createConfigDumpInfoExternalMetadataCollector(configDumpInfo),
    },
  }
  const contextFromXML: ConfigurationContextFromXML = {
    fromXML: { forReference: true },
    defaultLanguage: syncContext.defaultLanguage,
    version: syncContext.version,
  }
  const xmlManifest = new XmlSyncManifest(outputDir)
  const tasks: BatchTask<void>[] = []
  const rootYAMLPath = join(inputDir, CONFIGURATION_YAML_FILE)
  const hasRootYAML = fs.existsSync(rootYAMLPath)

  if (hasRootYAML) {
    const hasReferenceConfiguration =
      referenceDir !== undefined && fs.existsSync(join(referenceDir, CONFIGURATION_XML_FILE))
    const referenceConfiguration = hasReferenceConfiguration
      ? readConfigurationFromXML({ context: contextFromXML, inputDir: referenceDir })
      : undefined
    const referenceChildObjects = hasReferenceConfiguration
      ? readConfigurationChildObjectsFromXML(referenceDir)
      : undefined
    const configuration = readConfigurationFromYAML({
      context: syncContext,
      inputDir,
      source: referenceConfiguration,
    })

    writeConfigurationToXML({
      context: syncContext,
      configuration,
      outputDir,
      referenceConfiguration,
      childObjects: buildConfigurationChildObjects({ yamlDir: inputDir, referenceChildObjects }),
    })
    xmlManifest.addFile(join(outputDir, CONFIGURATION_XML_FILE))
    await writeRootConfigurationFilePathPropertiesToXML({
      context: syncContext,
      configuration,
      referenceConfiguration,
      outputDir,
      xmlManifest,
    })
    await syncRootConfigurationExternalFilesToXML({ context: syncContext, inputDir, outputDir, xmlManifest })
  }

  for (const resource of discoverTopLevelPropertiesResources(inputDir)) {
    const resourceRule = resource.owner.spec.rule
    const rule = TopLevelMetadataItemRules.find((candidate) => candidate.itemType === resourceRule.itemType) ?? resourceRule
    const xmlDir = rule.xmlDir
    const itemTypePrefix = rule.itemTypePrefix
    if (xmlDir === undefined || itemTypePrefix === undefined) continue

    const name = resource.owner.name
    const yamlDirAbs = join(inputDir, itemTypePrefix)
    const xmlOutputDir = join(outputDir, xmlDir)
    const xmlReferenceDir = referenceDir ? join(referenceDir, xmlDir) : undefined
    const currentObjectPath = `${itemTypePrefix}.${name}`
    const referencePath = migrationChain.referencePathByCurrentPath.get(currentObjectPath) ?? currentObjectPath
    const referencePathSegments = referencePath.split(".")
    const referenceName = referencePathSegments[referencePathSegments.length - 1]!
    const referenceModelRemapper: ReferenceModelRemapper | undefined =
      migrationChain.referencePathByCurrentPath.size > 0
        ? ({ rule, currentModel, referenceModel }) =>
            remapReferenceModel({
              rule,
              currentObjectPath,
              currentModel,
              referenceModel,
              referencePathByCurrentPath: migrationChain.referencePathByCurrentPath,
            })
        : undefined
    const xmlExternalOutputDir = join(xmlOutputDir, name)
    const xmlExternalReferenceDir = xmlReferenceDir ? join(xmlReferenceDir, referenceName) : undefined
    tasks.push({
      kind: rule.itemType,
      name,
      run: () =>
        syncAppliedObjectToXML({
          rule,
          context: { ...syncContext, exportToXML: { ...syncContext.exportToXML } },
          inputDir: yamlDirAbs,
          name,
          outputDir: xmlOutputDir,
          externalOutputDir: xmlExternalOutputDir,
          referenceDir: xmlReferenceDir,
          externalReferenceDir: xmlExternalReferenceDir,
          referenceName,
          referenceModelRemapper,
          xmlManifest,
        }),
    })
  }

  const batchResult = await runBatch(tasks, { concurrency: IO_CONCURRENCY })

  if (batchResult.failed.length === 0) {
    try {
      await syncConfigDumpInfoToXML({
        context: syncContext,
        outputDir,
        referenceDir,
        yamlState: migrationChain.yamlState,
        migrationState: migrationChain.migrationState,
        referencePathByCurrentPath: migrationChain.referencePathByCurrentPath,
        xmlManifest,
      })
      if (referenceDir) {
        await preserveUnsupportedRootExternalFilesToXML({ outputDir, referenceDir, xmlManifest })
      }
    } catch (error) {
      return {
        succeeded: batchResult.succeeded,
        failed: [{ kind: "rootExternalFiles", name: "Ext", error: toError(error) }],
      }
    }

    await pruneXmlByManifest({
      xmlRoot: outputDir,
      xmlDirs: [
        ROOT_EXTERNAL_XML_DIR,
        ...TopLevelMetadataItemRules.flatMap((rule) => (rule.xmlDir ? [rule.xmlDir] : [])),
      ],
      expectedFiles: xmlManifest.expectedFiles(),
    })
    await normalizeRootExternalDirCasing(outputDir)
    if (!hasRootYAML) {
      await fs.promises.rm(join(outputDir, CONFIGURATION_XML_FILE), { force: true })
    }
    writeAppliedMigrationsState(outputDir, {
      applied: [...migrationChain.appliedState.applied, ...migrationChain.pendingFileNames],
    })
    return {
      succeeded: batchResult.succeeded,
      failed: [],
      migrationsApplied: migrationChain.migrationsToApply,
    }
  }

  return {
    succeeded: batchResult.succeeded,
    failed: batchResult.failed.map((f) => ({
      kind: f.kind,
      name: f.name,
      parent: f.parent,
      error: f.error,
    })),
  }
}

export function resolveXmlAreaForMigrationPath(path: string): XmlSyncArea | undefined {
  try {
    const parsed = parseMigrationPath(path)
    const ownerPath = parsed.kind === "object" ? path : parsed.ownerPath
    const [itemTypePrefix, itemName] = ownerPath.split(".")
    if (!itemTypePrefix || !itemName) return undefined

    return resolveXmlSyncAreaForProjectPath(`${itemTypePrefix}/${itemName}/Свойства.yaml`, TopLevelMetadataItemRules)
  } catch {
    return undefined
  }
}

async function preserveUnsupportedRootExternalFilesToXML(params: {
  outputDir: string
  referenceDir: string
  xmlManifest: XmlSyncManifest
}): Promise<void> {
  const referenceRootExtDir = join(params.referenceDir, ROOT_EXTERNAL_XML_DIR)
  if (!fs.existsSync(referenceRootExtDir)) return

  const expectedFiles = params.xmlManifest.expectedFiles()
  await copyReferenceFilesMissingFromManifest({
    sourceDir: referenceRootExtDir,
    targetDir: join(params.outputDir, ROOT_EXTERNAL_XML_DIR),
    relativeDir: ROOT_EXTERNAL_XML_DIR,
    expectedFiles,
    xmlManifest: params.xmlManifest,
  })
}

async function copyReferenceFilesMissingFromManifest(params: {
  sourceDir: string
  targetDir: string
  relativeDir: string
  expectedFiles: Set<string>
  xmlManifest: XmlSyncManifest
}): Promise<void> {
  const entries = await fs.promises.readdir(params.sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = join(params.sourceDir, entry.name)
    const targetPath = join(params.targetDir, entry.name)
    const relativePath = `${params.relativeDir}/${entry.name}`

    if (entry.isDirectory()) {
      await copyReferenceFilesMissingFromManifest({
        sourceDir: sourcePath,
        targetDir: targetPath,
        relativeDir: relativePath,
        expectedFiles: params.expectedFiles,
        xmlManifest: params.xmlManifest,
      })
      continue
    }

    if (!entry.isFile() || params.expectedFiles.has(relativePath)) continue
    if (!isUnsupportedExtensionMetadataFile(relativePath)) continue

    await fs.promises.mkdir(dirname(targetPath), { recursive: true })
    await fs.promises.copyFile(sourcePath, targetPath)
    params.xmlManifest.addFile(targetPath)
  }
}

function isUnsupportedExtensionMetadataFile(relativePath: string): boolean {
  const pathInExt = relativePath.startsWith(`${ROOT_EXTERNAL_XML_DIR}/`)
    ? relativePath.slice(ROOT_EXTERNAL_XML_DIR.length + 1)
    : relativePath

  if (pathInExt === CONFIGURATION_XML_FILE || pathInExt === "ConfigDumpInfo.xml") return true

  return TopLevelMetadataItemRules.some((rule) => rule.xmlDir !== undefined && pathInExt.startsWith(`${rule.xmlDir}/`))
}

async function normalizeRootExternalDirCasing(outputDir: string): Promise<void> {
  const entries = fs.existsSync(outputDir) ? await fs.promises.readdir(outputDir) : []
  const hasVisibleLegacyDir = entries.includes(LEGACY_ROOT_EXTERNAL_XML_DIR)
  if (!hasVisibleLegacyDir) return

  const legacyDir = join(outputDir, LEGACY_ROOT_EXTERNAL_XML_DIR)
  const canonicalDir = join(outputDir, ROOT_EXTERNAL_XML_DIR)
  const hasVisibleCanonicalDir = entries.includes(ROOT_EXTERNAL_XML_DIR)
  if (hasVisibleCanonicalDir) {
    await fs.promises.rm(legacyDir, { recursive: true, force: true })
    return
  }

  if (fs.existsSync(canonicalDir)) {
    const [legacyRealPath, canonicalRealPath] = await Promise.all([
      fs.promises.realpath(legacyDir),
      fs.promises.realpath(canonicalDir),
    ])
    if (legacyRealPath === canonicalRealPath) {
      const tempDir = getAvailableRootExternalCaseRenameTempDir(outputDir)
      await fs.promises.rename(legacyDir, tempDir)
      await fs.promises.rename(tempDir, canonicalDir)
      return
    }
  }

  await fs.promises.rm(legacyDir, { recursive: true, force: true })
}

function getAvailableRootExternalCaseRenameTempDir(outputDir: string): string {
  const baseName = "ext.__nkdk_case_rename__"
  let candidate = join(outputDir, baseName)
  let index = 0

  while (fs.existsSync(candidate)) {
    index += 1
    candidate = join(outputDir, `${baseName}.${index}`)
  }

  return candidate
}

async function writeRootConfigurationFilePathPropertiesToXML(params: {
  context: ConfigurationContextWithExportToXML
  configuration: Record<string, unknown> | undefined
  referenceConfiguration: Record<string, unknown> | undefined
  outputDir: string
  xmlManifest: XmlSyncManifest
}): Promise<void> {
  const model = params.configuration
  if (model === undefined) return

  for (const [key, propRule] of Object.entries(MetadataConfigurationRules.properties) as [string, PropertyRule][]) {
    if (propRule.filePath === undefined) continue
    if (!getTypeRule(propRule.type, "exportToXML")) continue

    const modelHasOwnValue = Object.prototype.hasOwnProperty.call(model, key)
    const referenceValue = params.referenceConfiguration?.[key]
    const valueToExport = modelHasOwnValue
      ? model[key]
      : propRule.exportReferenceFileOnMissingValue === true
        ? referenceValue
        : undefined
    if (valueToExport === undefined) continue

    const xmlFileObj = exportPropertyToXML({
      context: params.context,
      rule: propRule,
      value: valueToExport,
      referenceMetadata: referenceValue,
    }) as Record<string, unknown> | undefined
    if (xmlFileObj === undefined) continue

    const outputPath = join(params.outputDir, propRule.filePath)
    await fs.promises.mkdir(dirname(outputPath), { recursive: true })
    await fs.promises.writeFile(outputPath, xmlExport(xmlFileObj), "utf-8")
    params.xmlManifest.addFile(outputPath)
  }
}

async function syncRootConfigurationExternalFilesToXML(params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  xmlManifest: XmlSyncManifest
}): Promise<void> {
  for (const [, propRule] of Object.entries(MetadataConfigurationRules.properties)) {
    const syncFn = getTypeRule(propRule.type, "syncExternalToXML")
    if (!syncFn) continue
    await syncFn({
      context: params.context,
      rule: propRule,
      nkdkDir: params.inputDir,
      xmlDir: params.outputDir,
      propertyValue: undefined,
      referencePropertyValue: undefined,
      xmlManifest: params.xmlManifest,
      name: "",
    })
  }
}
