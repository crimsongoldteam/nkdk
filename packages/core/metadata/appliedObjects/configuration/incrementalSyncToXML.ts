import fs from "fs"
import { join } from "path"
import type { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { syncAppliedObjectAreaToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { updateConfigDumpInfoVersionsToXML } from "../configDumpInfo/sync"
import { buildConfigurationChildObjects, readConfigurationChildObjectsFromXML } from "./childObjects"
import type { ConfigurationSyncResult } from "./convertFromXML"
import { buildIncrementalXmlSyncPlan } from "./incrementalPlan"
import {
  CONFIGURATION_YAML_FILE,
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
    if (plan.rebuildConfigurationXml) {
      await writeConfigurationArea(params)
    }

    for (const planned of plan.areas) {
      const rule = TopLevelMetadataItemRules.find((candidate) => candidate.itemType === planned.area.itemType)
      if (!rule?.itemTypePrefix || !rule.xmlDir) throw new Error(`Не найдено правило для ${planned.key}`)

      if (planned.area.kind === "externalFile") {
        for (const name of planned.area.dumpInfoNames) dumpInfoNames.add(name)
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
        })
        continue
      }

      if (planned.area.kind !== "owner") continue
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
      })
    }

    await updateConfigDumpInfoVersionsToXML({
      context: params.context,
      outputDir: params.outputDir,
      names: dumpInfoNames,
    })
    await writeXmlSyncState(params.outputDir, { version: 1, files: currentFiles })
    return { succeeded: plan.areas.length, failed: [] }
  } catch (error) {
    return {
      succeeded: 0,
      failed: [{ kind: "incrementalSync", name: "XML", error: toError(error) }],
    }
  }
}

async function writeConfigurationArea(params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<void> {
  if (!fs.existsSync(join(params.inputDir, CONFIGURATION_YAML_FILE))) return

  const referenceChildObjects = params.referenceDir ? readConfigurationChildObjectsFromXML(params.referenceDir) : undefined
  const configuration = readConfigurationFromYAML({ context: params.context, inputDir: params.inputDir })
  writeConfigurationToXML({
    context: params.context,
    configuration,
    outputDir: params.outputDir,
    childObjects: buildConfigurationChildObjects({ yamlDir: params.inputDir, referenceChildObjects }),
  })
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
