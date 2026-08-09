import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { TopLevelMetadataItemRules } from "../../metadata/appliedObjects/configuration/topLevelRules"
import type { MetadataItemRule } from "../../metadata/ruleRuntime/property/types"
import type { MetadataTarget } from "./types"

const appliedObjectsPath = "packages/core/metadata/appliedObjects"
type XmlDirRule = Pick<MetadataItemRule, "itemType" | "xmlDir">

export async function listMetadataItems(projectRoot: string): Promise<string[]> {
  const appliedObjectsDir = join(projectRoot, appliedObjectsPath)
  const entries = await readdir(appliedObjectsDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

export function resolveXmlDir(
  metadataItem: string,
  rules: readonly XmlDirRule[] = TopLevelMetadataItemRules
): string | undefined {
  const itemType = `${metadataItem.charAt(0).toUpperCase()}${metadataItem.slice(1)}`
  return rules.find((rule) => rule.itemType === itemType)?.xmlDir
}

export async function resolveMetadataTarget(projectRoot: string, metadataItem: string): Promise<MetadataTarget> {
  const available = await listMetadataItems(projectRoot)

  if (!available.includes(metadataItem)) {
    throw new Error(`metadataItem ${metadataItem} не найден. Доступные: ${available.join(", ")}`)
  }

  const itemDir = join(projectRoot, appliedObjectsPath, metadataItem)
  const fixturesDir = join(itemDir, "__fixtures__")

  return {
    metadataItem,
    itemDir,
    fixturesDir,
    syncXmlDir: join(fixturesDir, "sync/xml"),
    xmlDir: resolveXmlDir(metadataItem),
  }
}
