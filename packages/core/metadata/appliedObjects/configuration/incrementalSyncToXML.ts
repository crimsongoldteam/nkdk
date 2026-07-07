import fs from "fs"
import { join } from "path"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { syncAppliedObjectAreaToXML, syncAppliedObjectToXML } from "../../orchestration/appliedObject/syncToXML"
import type { ReferenceModelRemapper } from "../../orchestration/appliedObject/syncToXML"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import { diffXmlTree, snapshotXmlTree, type PreparedMetadataMigrationChain } from "../../operations"
import { updateConfigDumpInfoVersionsToXML } from "../configDumpInfo/sync"
import { buildConfigurationChildObjects, readConfigurationChildObjectsFromXML } from "./childObjects"
import type { ConfigurationSyncResult } from "./convertFromXML"
import { buildIncrementalXmlSyncPlan } from "./incrementalPlan"
import { parseMigrationPath, writeAppliedMigrationsState } from "./migrations"
import { remapReferenceModel } from "./migrations/referenceRemap"
import {
  CONFIGURATION_XML_FILE,
  CONFIGURATION_YAML_FILE,
  readConfigurationFromXML,
  readConfigurationFromYAML,
  writeConfigurationToXML,
} from "./rootIO"
import { diffSyncState, hashProjectFiles, readXmlSyncState, SYNC_STATE_FILE, writeXmlSyncState } from "./syncState"
import { prepareConfigurationXmlMigrationChain, syncConfigurationToXML } from "./syncToXML"
import { TopLevelMetadataItemRules } from "./topLevelRules"

export async function syncConfigurationIncrementallyToXML(params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<ConfigurationSyncResult> {
  const previousState = await readXmlSyncState(params.outputDir)
  if (!previousState) {
    return {
      succeeded: 0,
      failed: [{ kind: "syncState", name: SYNC_STATE_FILE, error: new Error(`Файл ${SYNC_STATE_FILE} не найден`) }],
    }
  }

  const currentFiles = await hashProjectFiles(params.inputDir)
  const diff = diffSyncState(previousState.files, currentFiles)
  const migrationChain = await prepareConfigurationXmlMigrationChain({
    context: params.context,
    inputDir: params.inputDir,
    outputDir: params.outputDir,
    referenceDir: params.referenceDir,
    useOutputAsReference: true,
  })
  if (!migrationChain.ok) {
    return {
      succeeded: 0,
      failed: [{ kind: "migration", name: "Миграции", error: new Error(JSON.stringify(migrationChain)) }],
      migrationChain,
    }
  }
  if (migrationChain.migrationsToApply.length > 0 && !fs.existsSync(join(params.outputDir, "ConfigDumpInfo.xml"))) {
    return syncConfigurationToXML({ ...params, referenceDir: params.referenceDir ?? params.outputDir })
  }
  if (
    diff.added.length === 0 &&
    diff.changed.length === 0 &&
    diff.deleted.length === 0 &&
    migrationChain.migrationsToApply.length === 0
  ) {
    return { succeeded: 0, failed: [] }
  }

  let plan
  try {
    plan = buildIncrementalXmlSyncPlan({ diff, rules: TopLevelMetadataItemRules, extraAreas: migrationChain.xmlAreas })
  } catch (error) {
    return {
      succeeded: 0,
      failed: [{ kind: "incrementalPlan", name: "changed paths", error: toError(error) }],
    }
  }

  try {
    const dumpInfoNames = new Set<string>()
    const xmlBefore = await snapshotXmlTree(params.outputDir)
    if (plan.rebuildConfigurationXml) {
      await writeConfigurationArea(params)
    }

    for (const planned of plan.areas) {
      const rule = TopLevelMetadataItemRules.find((candidate) => candidate.itemType === planned.area.itemType)
      if (!rule?.itemTypePrefix || !rule.xmlDir) throw new Error(`Не найдено правило для ${planned.key}`)

      switch (planned.area.kind) {
        case "externalFile": {
          for (const name of planned.area.dumpInfoNames) dumpInfoNames.add(name)
          const reference = buildMigrationReference({
            migrationChain,
            itemTypePrefix: planned.area.itemTypePrefix,
            itemName: planned.area.itemName,
          })
          const tracker = await createXmlChangeTracker(
            params.outputDir,
            join(params.outputDir, rule.xmlDir, planned.area.itemName)
          )
          await fs.promises.rm(join(params.outputDir, planned.area.xmlPath), { force: true })
          await syncAppliedObjectAreaToXML({
            area: { kind: "externalFile", xmlPath: planned.area.xmlPath },
            rule,
            context: { ...params.context, exportToXML: { ...params.context.exportToXML } },
            inputDir: join(params.inputDir, rule.itemTypePrefix),
            name: planned.area.itemName,
            outputDir: join(params.outputDir, rule.xmlDir),
            externalOutputDir: join(params.outputDir, rule.xmlDir, planned.area.itemName),
            referenceDir: params.referenceDir
              ? join(params.referenceDir, rule.xmlDir)
              : join(params.outputDir, rule.xmlDir),
            externalReferenceDir: params.referenceDir
              ? join(params.referenceDir, rule.xmlDir, planned.area.itemName)
              : join(params.outputDir, rule.xmlDir, reference.referenceName),
            referenceName: reference.referenceName,
            referenceModelRemapper: reference.referenceModelRemapper,
            xmlManifest: tracker.manifest,
          })
          break
        }
        case "fileItem": {
          for (const name of planned.area.dumpInfoNames) dumpInfoNames.add(name)
          const propertyRule = rule.properties[planned.area.propertyName]
          const writer = getTypeRule(planned.area.propertyType, "xmlSyncWriter")
          if (!propertyRule || !writer) throw new Error(`Не найден writer для ${planned.key}`)
          const tracker = await createXmlChangeTracker(
            params.outputDir,
            join(params.outputDir, rule.xmlDir, planned.area.itemName)
          )
          await writer({
            context: { ...params.context, exportToXML: { ...params.context.exportToXML } },
            rule: propertyRule,
            nkdkDir: join(params.inputDir, rule.itemTypePrefix, planned.area.itemName),
            xmlDir: join(params.outputDir, rule.xmlDir),
            name: planned.area.itemName,
            itemName: planned.area.routeParams.itemName,
            referenceDir: params.referenceDir
              ? join(params.referenceDir, rule.xmlDir)
              : join(params.outputDir, rule.xmlDir),
            xmlManifest: tracker.manifest,
          })
          break
        }
        case "owner": {
          const reference = buildMigrationReference({
            migrationChain,
            itemTypePrefix: planned.area.itemTypePrefix,
            itemName: planned.area.itemName,
          })
          const tracker = await createXmlChangeTracker(
            params.outputDir,
            join(params.outputDir, rule.xmlDir, `${planned.area.itemName}.xml`)
          )
          const syncParams = {
            rule,
            context: { ...params.context, exportToXML: { ...params.context.exportToXML } },
            inputDir: join(params.inputDir, rule.itemTypePrefix),
            name: planned.area.itemName,
            outputDir: join(params.outputDir, rule.xmlDir),
            externalOutputDir: join(params.outputDir, rule.xmlDir, planned.area.itemName),
            referenceDir: params.referenceDir
              ? join(params.referenceDir, rule.xmlDir)
              : join(params.outputDir, rule.xmlDir),
            externalReferenceDir: params.referenceDir
              ? join(params.referenceDir, rule.xmlDir, reference.referenceName)
              : join(params.outputDir, rule.xmlDir, reference.referenceName),
            referenceName: reference.referenceName,
            referenceModelRemapper: reference.referenceModelRemapper,
            xmlManifest: tracker.manifest,
          }
          if (planned.fromMigration) {
            await syncAppliedObjectToXML(syncParams)
          } else {
            await syncAppliedObjectAreaToXML({ ...syncParams, area: { kind: "owner" } })
          }
          break
        }
        default:
          assertNever(planned.area)
      }
    }

    await updateConfigDumpInfoVersionsToXML({
      context: params.context,
      outputDir: params.outputDir,
      names: dumpInfoNames,
    })
    await removeRenamedObjectXmlFiles({
      outputDir: params.outputDir,
      migrations: migrationChain.migrationsToApply,
    })
    const changedXmlFiles = await diffXmlTree(params.outputDir, xmlBefore)
    writeAppliedMigrationsState(params.outputDir, {
      applied: [...migrationChain.appliedState.applied, ...migrationChain.pendingFileNames],
    })
    await writeXmlSyncState(params.outputDir, { version: 1, files: currentFiles })
    return {
      succeeded: plan.areas.length,
      changedXmlFiles,
      migrationsApplied: migrationChain.migrationsToApply,
      failed: [],
    }
  } catch (error) {
    return {
      succeeded: 0,
      failed: [{ kind: "incrementalSync", name: "XML", error: toError(error) }],
    }
  }
}

async function createXmlChangeTracker(
  _outputDir: string,
  _targetPath: string
): Promise<{ manifest: XmlWriteManifest }> {
  return {
    manifest: {
      addFile(): void {},
    },
  }
}

function buildMigrationReference(params: {
  migrationChain: PreparedMetadataMigrationChain
  itemTypePrefix: string
  itemName: string
}): { referenceName: string; referenceModelRemapper?: ReferenceModelRemapper } {
  const currentObjectPath = `${params.itemTypePrefix}.${params.itemName}`
  const referencePath = params.migrationChain.referencePathByCurrentPath.get(currentObjectPath) ?? currentObjectPath
  const segments = referencePath.split(".")
  const referenceName = segments[segments.length - 1] ?? params.itemName
  const referenceModelRemapper: ReferenceModelRemapper | undefined =
    params.migrationChain.referencePathByCurrentPath.size > 0
      ? ({ rule, currentModel, referenceModel }) =>
          remapReferenceModel({
            rule,
            currentObjectPath,
            currentModel,
            referenceModel,
            referencePathByCurrentPath: params.migrationChain.referencePathByCurrentPath,
          })
      : undefined

  return { referenceName, referenceModelRemapper }
}

async function removeRenamedObjectXmlFiles(params: {
  outputDir: string
  migrations: readonly { from: string; to: string }[]
}): Promise<void> {
  for (const migration of params.migrations) {
    const from = parseMigrationPath(migration.from)
    const to = parseMigrationPath(migration.to)
    if (from.kind !== "object" || to.kind !== "object") continue
    if (from.localName.toLocaleLowerCase("ru") === to.localName.toLocaleLowerCase("ru")) continue

    const rule = TopLevelMetadataItemRules.find((candidate) => candidate.itemTypePrefix === from.segments[0])
    if (!rule?.xmlDir) continue

    await fs.promises.rm(join(params.outputDir, rule.xmlDir, `${from.localName}.xml`), { force: true })
    await fs.promises.rm(join(params.outputDir, rule.xmlDir, from.localName), { recursive: true, force: true })
  }
}

function assertNever(value: never): never {
  throw new Error(`Неизвестная область XML-синхронизации: ${String(value)}`)
}

async function writeConfigurationArea(params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<void> {
  if (!fs.existsSync(join(params.inputDir, CONFIGURATION_YAML_FILE))) return

  const referenceDir = params.referenceDir ?? params.outputDir
  const hasReferenceConfiguration = fs.existsSync(join(referenceDir, CONFIGURATION_XML_FILE))
  const referenceContext = { ...params.context, fromXML: { forReference: true } }
  const referenceConfiguration = hasReferenceConfiguration
    ? readConfigurationFromXML({ context: referenceContext, inputDir: referenceDir })
    : undefined
  const referenceChildObjects = hasReferenceConfiguration
    ? readConfigurationChildObjectsFromXML(referenceDir)
    : undefined
  const configuration = readConfigurationFromYAML({
    context: params.context,
    inputDir: params.inputDir,
    source: referenceConfiguration,
  })
  writeConfigurationToXML({
    context: params.context,
    configuration,
    outputDir: params.outputDir,
    referenceConfiguration,
    childObjects: buildConfigurationChildObjects({ yamlDir: params.inputDir, referenceChildObjects }),
  })
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
