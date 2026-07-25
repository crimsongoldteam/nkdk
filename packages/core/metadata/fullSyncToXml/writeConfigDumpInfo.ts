import fs from "node:fs"
import { join } from "node:path"
import { xmlExport } from "../../xml/export/exporter"
import { buildConfigDumpInfo } from "../appliedObjects/configDumpInfo/build"
import { exportConfigDumpInfoToXML } from "../appliedObjects/configDumpInfo/toXML"
import type { ConfigDumpInfo } from "../appliedObjects/configDumpInfo/types"
import {
  configDumpInfoNameFromMigrationPath,
  isManagedConfigDumpInfoRootSegment,
} from "../appliedObjects/configDumpInfo/nameMapping"
import {
  collectConfigDumpInfoConfigurationIndex,
  CONFIG_DUMP_INFO_INDEX_ROOT,
  configDumpInfoChildAddress,
  configDumpInfoChildrenAddress,
  configDumpInfoEntryAddress,
} from "../appliedObjects/configDumpInfo/configurationIndex"
import type { StructuralState } from "../appliedObjects/configuration/migrations/types"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../configurationIndex/exportRuntime"
import type { ConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationIndexFragment } from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import type { FullXmlSyncAssignment } from "./types"

const CONFIG_DUMP_INFO_FILE = "ConfigDumpInfo.xml"
const TARGET_PROJECT_PATH = "Конфигурация.yaml"

export interface WriteFullXmlSyncConfigDumpInfoParams {
  readonly context: ConfigurationContext
  readonly outputDir: string
  readonly assignments: readonly FullXmlSyncAssignment[]
  readonly index: ConfigurationIndexReader
}

export interface WriteFullXmlSyncConfigDumpInfoResult {
  readonly targetXmlPath: typeof CONFIG_DUMP_INFO_FILE
  readonly fragment: ConfigurationIndexFragment
}

export async function writeFullXmlSyncConfigDumpInfo(
  params: WriteFullXmlSyncConfigDumpInfoParams
): Promise<WriteFullXmlSyncConfigDumpInfoResult> {
  const yamlState = structuralStateFromAssignments(params.assignments)
  const generatedAddresses = generationAddressesFromState(yamlState)
  const collector = createConfigurationIndexCollector()
  const runtime = createConfigurationIndexExportRuntime({
    source: params.index,
    collector,
    targetProjectPath: TARGET_PROJECT_PATH,
    logicalAddress: "ConfigDumpInfo",
  })
  const reference = referenceConfigDumpInfoFromIndex(params.index)
  const idMap = buildConfigDumpInfo({
    reference,
    collected: retainedReferenceEntries(reference, yamlState),
    yamlState,
    migrationState: yamlState,
    referencePathByCurrentPath: new Map(),
    generators: {
      id: () => runtime.identityOrCreate("uuid", nextGeneratedAddress()),
      configVersion: () => {
        const address = nextGeneratedAddress()
        const value = runtime.configVersion(`${address}.configVersion`)
        collector.setXmlText(`${address}.configVersion`, value)
        return value
      },
    },
  })
  collectConfigDumpInfoConfigurationIndex(idMap, collector)
  const xml = exportConfigDumpInfoToXML({ context: params.context, idMap })
  await fs.promises.mkdir(params.outputDir, { recursive: true })
  await fs.promises.writeFile(join(params.outputDir, CONFIG_DUMP_INFO_FILE), xmlExport({ ConfigDumpInfo: xml }), "utf-8")
  return { targetXmlPath: CONFIG_DUMP_INFO_FILE, fragment: collector.fragment(TARGET_PROJECT_PATH) }

  function nextGeneratedAddress(): string {
    const value = generatedAddresses.shift()
    if (value === undefined) throw new Error("Не найден адрес генерации ConfigDumpInfo")
    return value
  }
}

function retainedReferenceEntries(reference: ConfigDumpInfo, yamlState: StructuralState): ConfigDumpInfo | undefined {
  const currentOwners = new Set(
    [...yamlState.nodes.keys()].map((path) => configDumpInfoNameFromMigrationPath(path).split(".").slice(0, 2).join("."))
  )
  const retained = new Map(
    [...reference].filter(([name]) => {
      const rootSegment = name.split(".")[0]
      if (rootSegment === undefined || !isManagedConfigDumpInfoRootSegment(rootSegment)) return false
      return currentOwners.has(name.split(".").slice(0, 2).join("."))
    })
  )
  return retained.size === 0 ? undefined : retained
}

function referenceConfigDumpInfoFromIndex(index: ConfigurationIndexReader): ConfigDumpInfo {
  const result: ConfigDumpInfo = new Map()
  for (const dumpName of index.xmlNode(CONFIG_DUMP_INFO_INDEX_ROOT)?.order ?? []) {
    const address = configDumpInfoEntryAddress(dumpName)
    const id = index.identity(address, "xmlId") ?? index.identity(address, "uuid")
    const configVersion = index.xmlValue(`${address}.configVersion`)?.xmlText
    if (id !== undefined) {
      const children = new Map<string, string>()
      for (const childName of index.xmlNode(configDumpInfoChildrenAddress(dumpName))?.order ?? []) {
        const childId = index.identity(configDumpInfoChildAddress(dumpName, childName), "xmlId")
        if (childId !== undefined) children.set(childName, childId)
      }
      result.set(dumpName, { id, configVersion: configVersion ?? "", children })
    }
  }
  return result
}

function structuralStateFromAssignments(assignments: readonly FullXmlSyncAssignment[]): StructuralState {
  const nodes = new Map<string, { path: string; kind: "object"; name: string }>()
  for (const assignment of assignments) {
    if (assignment.role !== "properties") continue
    const path = assignment.logicalAddress
    nodes.set(path, { path, kind: "object", name: assignment.itemName })
  }
  return { nodes }
}

function generationAddressesFromState(yamlState: StructuralState): string[] {
  return [...yamlState.nodes.keys()].flatMap((path) => {
    const address = configDumpInfoAddress(configDumpInfoNameFromMigrationPath(path))
    return [address, address]
  })
}

function configDumpInfoAddress(dumpName: string): string {
  return configDumpInfoEntryAddress(dumpName)
}
