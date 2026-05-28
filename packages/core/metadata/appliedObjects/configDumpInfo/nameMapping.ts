import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { TopLevelMetadataItemRules } from "../configuration/topLevelRules"

const CHILD_SEGMENT_TO_DUMP = new Map<string, string>([
  ["Реквизит", "Attribute"],
  ["РеквизитАдресации", "AddressingAttribute"],
  ["ТабличнаяЧасть", "TabularSection"],
  ["Измерение", "Dimension"],
  ["Ресурс", "Resource"],
])

const rootSegmentToDump = new Map(
  TopLevelMetadataItemRules.filter(
    (rule): rule is MetadataItemRule & { itemTypePrefix: string } => rule.itemTypePrefix !== undefined,
  )
    .map((rule) => [rule.itemTypePrefix, getXMLRootContainer(rule)] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
)

export function configDumpInfoNameFromMigrationPath(path: string): string {
  const parts = path.split(".")
  const [rootSegment, rootName, ...tail] = parts
  const rootDump = rootSegment ? rootSegmentToDump.get(rootSegment) : undefined

  if (!rootSegment || !rootName || !rootDump) {
    throw new Error(`Неподдерживаемый корневой путь ConfigDumpInfo "${path}"`)
  }

  if (tail.length % 2 !== 0) {
    throw new Error(`Некорректный путь ConfigDumpInfo "${path}"`)
  }

  const dumpParts = [rootDump, rootName]
  for (let i = 0; i < tail.length; i += 2) {
    const segment = tail[i]!
    const name = tail[i + 1]!
    const dumpSegment = CHILD_SEGMENT_TO_DUMP.get(segment)
    if (!dumpSegment) throw new Error(`Неподдерживаемый сегмент ConfigDumpInfo "${segment}"`)
    dumpParts.push(dumpSegment, name)
  }

  return dumpParts.join(".")
}

function getXMLRootContainer(rule: MetadataItemRule): string | undefined {
  const xmlRootEntry = Object.entries(rule.properties).find(([, propertyRule]) => propertyRule.type === "XMLRoot")
  return xmlRootEntry ? (xmlRootEntry[1] as { container?: string }).container : undefined
}
