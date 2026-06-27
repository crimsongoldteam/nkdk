import fs from "fs"
import { dirname, join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import type { ReferenceModelRemapper } from "~/metadata/orchestration/appliedObject/syncToXML"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { exportPropertyToXML } from "~/metadata/orchestration/property/toXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { discoverMetadataProjectResources, type MetadataProjectPropertiesYamlRef } from "~/metadata/project/resources"
import { xmlExport } from "~/xml/export/exporter"
import {
  applyPendingMigrationFiles,
  collectStructuralStateFromXML,
  collectStructuralStateFromYAML,
  detectMigrationConflicts,
  readAppliedMigrationsState,
  readPendingMigrationEntries,
  validateAppliedMigrationTarget,
  writeAppliedMigrationsState,
} from "./migrations"
import { remapReferenceModel } from "./migrations/referenceRemap"
import { pruneXmlByManifest, XmlSyncManifest } from "./migrations/xmlManifest"
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

  const appliedState = readAppliedMigrationsState(outputDir)
  const pendingMigrations = readPendingMigrationEntries(inputDir, appliedState)
  const contextFromXML: ConfigurationContextFromXML = {
    fromXML: { forReference: true },
    defaultLanguage: context.defaultLanguage,
    version: context.version,
  }
  const referenceState = referenceDir
    ? await collectStructuralStateFromXML({ xmlDir: referenceDir, context: contextFromXML })
    : { nodes: new Map() }
  const yamlState = await collectStructuralStateFromYAML({ yamlDir: inputDir, context })
  const migrationResult = applyPendingMigrationFiles(referenceState, pendingMigrations)
  validateAppliedMigrationTarget(migrationResult, yamlState)
  const conflicts = detectMigrationConflicts(migrationResult.state, yamlState)
  if (conflicts.length > 0) {
    const details = conflicts
      .map((c) => `${c.levelPath}: удалено [${c.deleted.join(", ")}], добавлено [${c.added.join(", ")}]`)
      .join("\n")
    return {
      succeeded: 0,
      failed: [
        {
          kind: "migration",
          name: "Миграции",
          error: new Error(
            `Найдены возможные переименования:\n${details}\nЗапустите: nkdk generate-migration ${inputDir} ${referenceDir ?? outputDir}`
          ),
        },
      ],
    }
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
      context,
      inputDir,
      source: referenceConfiguration,
    })

    writeConfigurationToXML({
      context,
      configuration,
      outputDir,
      referenceConfiguration,
      childObjects: buildConfigurationChildObjects({ yamlDir: inputDir, referenceChildObjects }),
    })
    xmlManifest.addFile(join(outputDir, CONFIGURATION_XML_FILE))
    await writeRootConfigurationFilePathPropertiesToXML({
      context,
      configuration,
      referenceConfiguration,
      outputDir,
      xmlManifest,
    })
    await syncRootConfigurationExternalFilesToXML({ context, inputDir, outputDir, xmlManifest })
  }

  for (const resource of discoverTopLevelPropertiesResources(inputDir)) {
    const rule = resource.owner.spec.rule
    const xmlDir = rule.xmlDir
    const itemTypePrefix = rule.itemTypePrefix
    if (xmlDir === undefined || itemTypePrefix === undefined) continue

    const name = resource.owner.name
    const yamlDirAbs = join(inputDir, itemTypePrefix)
    const xmlOutputDir = join(outputDir, xmlDir)
    const xmlReferenceDir = referenceDir ? join(referenceDir, xmlDir) : undefined
    const currentObjectPath = `${itemTypePrefix}.${name}`
    const referencePath = migrationResult.referencePathByCurrentPath.get(currentObjectPath) ?? currentObjectPath
    const referencePathSegments = referencePath.split(".")
    const referenceName = referencePathSegments[referencePathSegments.length - 1]!
    const currentNode = migrationResult.state.nodes.get(currentObjectPath)
    const referenceModel = currentNode && currentNode.referencePath === undefined ? null : undefined
    const referenceModelRemapper: ReferenceModelRemapper | undefined =
      migrationResult.referencePathByCurrentPath.size > 0
        ? ({ rule, currentModel, referenceModel }) =>
            remapReferenceModel({
              rule,
              currentObjectPath,
              currentModel,
              referenceModel,
              referencePathByCurrentPath: migrationResult.referencePathByCurrentPath,
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
          context: { ...context, exportToXML: { ...context.exportToXML } },
          inputDir: yamlDirAbs,
          name,
          outputDir: xmlOutputDir,
          externalOutputDir: xmlExternalOutputDir,
          referenceDir: xmlReferenceDir,
          externalReferenceDir: xmlExternalReferenceDir,
          referenceName,
          referenceModel,
          referenceModelRemapper,
          xmlManifest,
        }),
    })
  }

  const batchResult = await runBatch(tasks, { concurrency: IO_CONCURRENCY })

  if (batchResult.failed.length === 0) {
    try {
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
      applied: [...appliedState.applied, ...migrationResult.appliedFileNames],
    })
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
