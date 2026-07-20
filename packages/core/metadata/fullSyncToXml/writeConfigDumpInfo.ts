import fs from "node:fs"
import { join } from "node:path"
import { xmlExport } from "../../xml/export/exporter"
import { buildConfigDumpInfo } from "../appliedObjects/configDumpInfo/build"
import { exportConfigDumpInfoToXML } from "../appliedObjects/configDumpInfo/toXML"
import type { ConfigDumpInfo } from "../appliedObjects/configDumpInfo/types"
import { configDumpInfoNameFromMigrationPath } from "../appliedObjects/configDumpInfo/nameMapping"
import type { StructuralState } from "../appliedObjects/configuration/migrations/types"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../configurationIndex/exportRuntime"
import type { ConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationIndexFragment } from "../configurationIndex/types"
import { yamlKeyUid } from "../configurationIndex/logicalAddress"
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
  const reference = referenceConfigDumpInfoFromIndex({ index: params.index, yamlState })
  const idMap = buildConfigDumpInfo({
    reference,
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

function referenceConfigDumpInfoFromIndex(params: {
  index: ConfigurationIndexReader
  yamlState: StructuralState
}): ConfigDumpInfo {
  const result: ConfigDumpInfo = new Map()
  for (const path of params.yamlState.nodes.keys()) {
    const dumpName = configDumpInfoNameFromMigrationPath(path)
    const address = configDumpInfoAddress(dumpName)
    const id = params.index.identity(address, "uuid")
    const configVersion = params.index.xmlValue(`${address}.configVersion`)?.xmlText
    if (id !== undefined) {
      result.set(dumpName, { id, configVersion: configVersion ?? "", children: new Map() })
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
  return yamlKeyUid("Конфигурация.ConfigDumpInfo", dumpName)
}
