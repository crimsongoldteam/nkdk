import fs from "node:fs"
import { importContentFromXML } from "../../../xml/import/importer"
import {
  createConfigurationIndexCollector,
  type ConfigurationIndexCollector,
} from "../../configurationIndex/collector/writer"
import { yamlKeyUid } from "../../configurationIndex/logicalAddress"
import { registerMetadataSnapshotImportCapability } from "../../resourceTopology/capabilities"
import { importConfigDumpInfoFromXML } from "./fromXML"
import type { ConfigDumpInfo, ConfigDumpInfoXML } from "./types"

export const CONFIG_DUMP_INFO_INDEX_ROOT = "Конфигурация.ConfigDumpInfo"

export function configDumpInfoEntryAddress(name: string): string {
  return yamlKeyUid(CONFIG_DUMP_INFO_INDEX_ROOT, name)
}

export function configDumpInfoChildrenAddress(name: string): string {
  return `${configDumpInfoEntryAddress(name)}.children`
}

export function configDumpInfoChildAddress(ownerName: string, childName: string): string {
  return yamlKeyUid(configDumpInfoChildrenAddress(ownerName), childName)
}

export function collectConfigDumpInfoConfigurationIndex(
  idMap: ConfigDumpInfo,
  collector: ConfigurationIndexCollector
): void {
  collector.setOrder(CONFIG_DUMP_INFO_INDEX_ROOT, [...idMap.keys()])
  for (const [name, entry] of idMap) {
    const address = configDumpInfoEntryAddress(name)
    collector.setXmlId(address, entry.id)
    if (entry.configVersion.length > 0) collector.setXmlText(`${address}.configVersion`, entry.configVersion)
    collector.setOrder(configDumpInfoChildrenAddress(name), [...entry.children.keys()])
    for (const [childName, id] of entry.children) {
      collector.setXmlId(configDumpInfoChildAddress(name, childName), id)
    }
  }
}

registerMetadataSnapshotImportCapability({
  id: "configDumpInfo",
  async run({ context, sourcePath, targetProjectPath }) {
    const source = await fs.promises.readFile(sourcePath, "utf-8")
    const parsed = importContentFromXML<{ ConfigDumpInfo: ConfigDumpInfoXML }>(source)
    const idMap = importConfigDumpInfoFromXML({ context, xml: parsed.ConfigDumpInfo })
    const collector = createConfigurationIndexCollector()
    collectConfigDumpInfoConfigurationIndex(idMap, collector)
    return collector.fragment(targetProjectPath)
  },
})
