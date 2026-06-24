import type {
  ExternalMetadataCollector,
  ExternalMetadataContextItem,
} from "~/metadata/orchestration/externalMetadata/types"
import type { ConfigDumpInfo, ConfigDumpInfoEntry } from "./types"

export function createConfigDumpInfoExternalMetadataCollector(target: ConfigDumpInfo): ExternalMetadataCollector {
  return {
    recordUuid({ itemsTree, uuid }) {
      const current = itemsTree[itemsTree.length - 1]
      if (!current?.externalMetadata) return

      const externalName = buildExternalName(itemsTree)
      if (!externalName) {
        throw new Error(`Не удалось определить внешнее имя для "${current.path}"`)
      }

      if (current.externalMetadata.placement === "ownerChild") {
        const ownerName = findOwnerEntryName(itemsTree.slice(0, -1))
        if (!ownerName) {
          throw new Error(`Не найден владелец внешней metadata-записи "${externalName}"`)
        }
        const owner = ensureEntry(target, ownerName, "")
        owner.children.set(externalName, uuid)
        return
      }

      const entry = ensureEntry(target, externalName, uuid)
      entry.id = uuid
    },

    recordDerived({ itemsTree, segment, name }) {
      const baseName = findOwnerEntryName(itemsTree, { includeOwnerChild: true })
      if (!baseName) {
        throw new Error(`Не найден владелец производной внешней metadata-записи "${segment}"`)
      }

      const externalName = [baseName, segment, name].filter((part): part is string => Boolean(part)).join(".")
      const entry = ensureEntry(target, externalName, "")
      entry.derivedFrom = baseName
    },
  }
}

function buildExternalName(itemsTree: readonly ExternalMetadataContextItem[]): string | undefined {
  const parts: string[] = []
  for (const item of itemsTree) {
    if (!item.externalMetadata) continue
    parts.push(item.externalMetadata.segment, item.name)
  }
  return parts.length > 0 ? parts.join(".") : undefined
}

function findOwnerEntryName(
  itemsTree: readonly ExternalMetadataContextItem[],
  options: { includeOwnerChild?: boolean } = {}
): string | undefined {
  for (let i = itemsTree.length - 1; i >= 0; i--) {
    const ownerName = buildExternalName(itemsTree.slice(0, i + 1))
    const placement = itemsTree[i]?.externalMetadata?.placement
    if (ownerName && (placement === "rootEntry" || placement === "ownedEntry")) return ownerName
    if (ownerName && options.includeOwnerChild === true && placement === "ownerChild") return ownerName
  }
  return undefined
}

function ensureEntry(target: ConfigDumpInfo, name: string, id: string): ConfigDumpInfoEntry {
  const existing = target.get(name)
  if (existing) return existing

  const entry = { id, configVersion: "", children: new Map<string, string>() }
  target.set(name, entry)
  return entry
}
