import fs from "fs"
import { join, relative, sep } from "path"
import type { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { syncAppliedObjectAreaToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"
import { updateConfigDumpInfoVersionsToXML } from "../configDumpInfo/sync"
import { buildConfigurationChildObjects, readConfigurationChildObjectsFromXML } from "./childObjects"
import type { ConfigurationSyncResult } from "./convertFromXML"
import { buildIncrementalXmlSyncPlan } from "./incrementalPlan"
import {
  CONFIGURATION_XML_FILE,
  CONFIGURATION_YAML_FILE,
  readConfigurationFromXML,
  readConfigurationFromYAML,
  writeConfigurationToXML,
} from "./rootIO"
import { diffSyncState, hashProjectFiles, readXmlSyncState, SYNC_STATE_FILE, writeXmlSyncState } from "./syncState"
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
  if (diff.added.length === 0 && diff.changed.length === 0 && diff.deleted.length === 0) {
    return { succeeded: 0, failed: [] }
  }

  let plan
  try {
    plan = buildIncrementalXmlSyncPlan({ diff, rules: TopLevelMetadataItemRules })
  } catch (error) {
    return {
      succeeded: 0,
      failed: [{ kind: "incrementalPlan", name: "changed paths", error: toError(error) }],
    }
  }

  try {
    const dumpInfoNames = new Set<string>()
    const changedXmlFiles = new Set<string>()
    if (plan.rebuildConfigurationXml) {
      await writeConfigurationArea(params)
      changedXmlFiles.add(CONFIGURATION_XML_FILE)
    }

    for (const planned of plan.areas) {
      const rule = TopLevelMetadataItemRules.find((candidate) => candidate.itemType === planned.area.itemType)
      if (!rule?.itemTypePrefix || !rule.xmlDir) throw new Error(`Не найдено правило для ${planned.key}`)

      switch (planned.area.kind) {
        case "externalFile": {
          for (const name of planned.area.dumpInfoNames) dumpInfoNames.add(name)
          const tracker = await createXmlChangeTracker(params.outputDir, join(params.outputDir, rule.xmlDir, planned.area.itemName))
          await fs.promises.rm(join(params.outputDir, planned.area.xmlPath), { force: true })
          await syncAppliedObjectAreaToXML({
            area: { kind: "externalFile", xmlPath: planned.area.xmlPath },
            rule,
            context: { ...params.context, exportToXML: { ...params.context.exportToXML } },
            inputDir: join(params.inputDir, rule.itemTypePrefix),
            name: planned.area.itemName,
            outputDir: join(params.outputDir, rule.xmlDir),
            externalOutputDir: join(params.outputDir, rule.xmlDir, planned.area.itemName),
            referenceDir: params.referenceDir ? join(params.referenceDir, rule.xmlDir) : join(params.outputDir, rule.xmlDir),
            externalReferenceDir: params.referenceDir
              ? join(params.referenceDir, rule.xmlDir, planned.area.itemName)
              : join(params.outputDir, rule.xmlDir, planned.area.itemName),
            xmlManifest: tracker.manifest,
          })
          for (const path of await tracker.changedXmlFiles()) changedXmlFiles.add(path)
          break
        }
        case "fileItem": {
          for (const name of planned.area.dumpInfoNames) dumpInfoNames.add(name)
          const propertyRule = rule.properties[planned.area.propertyName]
          const writer = getTypeRule(planned.area.propertyType, "xmlSyncWriter")
          if (!propertyRule || !writer) throw new Error(`Не найден writer для ${planned.key}`)
          const tracker = await createXmlChangeTracker(params.outputDir, join(params.outputDir, rule.xmlDir, planned.area.itemName))
          await writer({
            context: { ...params.context, exportToXML: { ...params.context.exportToXML } },
            rule: propertyRule,
            nkdkDir: join(params.inputDir, rule.itemTypePrefix, planned.area.itemName),
            xmlDir: join(params.outputDir, rule.xmlDir),
            name: planned.area.itemName,
            itemName: planned.area.routeParams.itemName,
            referenceDir: params.referenceDir ? join(params.referenceDir, rule.xmlDir) : join(params.outputDir, rule.xmlDir),
            xmlManifest: tracker.manifest,
          })
          for (const path of await tracker.changedXmlFiles()) changedXmlFiles.add(path)
          break
        }
        case "owner": {
          const tracker = await createXmlChangeTracker(
            params.outputDir,
            join(params.outputDir, rule.xmlDir, `${planned.area.itemName}.xml`)
          )
          await syncAppliedObjectAreaToXML({
            area: { kind: "owner" },
            rule,
            context: { ...params.context, exportToXML: { ...params.context.exportToXML } },
            inputDir: join(params.inputDir, rule.itemTypePrefix),
            name: planned.area.itemName,
            outputDir: join(params.outputDir, rule.xmlDir),
            externalOutputDir: join(params.outputDir, rule.xmlDir, planned.area.itemName),
            referenceDir: params.referenceDir ? join(params.referenceDir, rule.xmlDir) : join(params.outputDir, rule.xmlDir),
            externalReferenceDir: params.referenceDir
              ? join(params.referenceDir, rule.xmlDir, planned.area.itemName)
              : join(params.outputDir, rule.xmlDir, planned.area.itemName),
            xmlManifest: tracker.manifest,
          })
          for (const path of await tracker.changedXmlFiles()) changedXmlFiles.add(path)
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
    await writeXmlSyncState(params.outputDir, { version: 1, files: currentFiles })
    return { succeeded: plan.areas.length, changedXmlFiles: [...changedXmlFiles].sort(), failed: [] }
  } catch (error) {
    return {
      succeeded: 0,
      failed: [{ kind: "incrementalSync", name: "XML", error: toError(error) }],
    }
  }
}

async function createXmlChangeTracker(
  outputDir: string,
  targetPath: string
): Promise<{ manifest: XmlWriteManifest; changedXmlFiles: () => Promise<string[]> }> {
  const before = await snapshotXmlFiles(targetPath)
  const writtenFiles = new Set<string>()
  return {
    manifest: {
      addFile(absPath: string): void {
        writtenFiles.add(absPath)
      },
    },
    changedXmlFiles: async () => {
      const changed: string[] = []
      for (const absPath of [...writtenFiles].sort()) {
        const previous = before.get(absPath)
        const current = await readFileIfExists(absPath)
        if (previous !== current) changed.push(relative(outputDir, absPath).split(sep).join("/"))
      }
      return changed
    },
  }
}

async function snapshotXmlFiles(targetPath: string): Promise<Map<string, string | undefined>> {
  const result = new Map<string, string | undefined>()
  await snapshotPath(targetPath, result)
  return result
}

async function snapshotPath(targetPath: string, result: Map<string, string | undefined>): Promise<void> {
  if (!fs.existsSync(targetPath)) return
  const stat = await fs.promises.stat(targetPath)
  if (stat.isFile()) {
    result.set(targetPath, await fs.promises.readFile(targetPath, "utf-8"))
    return
  }
  if (!stat.isDirectory()) return
  const entries = await fs.promises.readdir(targetPath, { withFileTypes: true })
  for (const entry of entries) {
    await snapshotPath(join(targetPath, entry.name), result)
  }
}

async function readFileIfExists(path: string): Promise<string | undefined> {
  if (!fs.existsSync(path)) return undefined
  return fs.promises.readFile(path, "utf-8")
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
