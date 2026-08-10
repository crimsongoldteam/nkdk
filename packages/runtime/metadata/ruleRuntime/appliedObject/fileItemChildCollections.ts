import fs from "fs"
import { join } from "path"
import type { MetadataItemRule } from "../property/types"

const PROPERTIES_YAML = "Свойства.yaml"

type MetadataItemChildCollection = NonNullable<MetadataItemRule["childCollections"]>[number]
type ChildCollectionDir = NonNullable<MetadataItemChildCollection["nkdkDir"]>

export type FileItemChildCollection = Pick<
  MetadataItemChildCollection,
  "propertyKey" | "nkdkDir" | "xmlDir" | "fileItemRule"
>

export type FileItemCollectionItem = {
  name: string
  model: Record<string, unknown>
}

export function getFileItemXMLRootContainer(rule: MetadataItemRule): string | undefined {
  const xmlRoot = Object.values(rule.properties).find((propertyRule) => propertyRule.type === "XMLRoot")
  const container = (xmlRoot as { container?: unknown } | undefined)?.container
  return typeof container === "string" ? container : undefined
}

export function normalizeFileItemCollectionItems(collectionModel: unknown): FileItemCollectionItem[] {
  if (typeof collectionModel === "string") return [{ name: collectionModel, model: { name: collectionModel } }]

  if (Array.isArray(collectionModel)) {
    return collectionModel
      .map((item): FileItemCollectionItem | undefined => {
        if (typeof item === "string") return { name: item, model: { name: item } }
        if (!item || typeof item !== "object") return undefined

        const model = item as Record<string, unknown>
        const name = String(model["name"] ?? "")
        return name ? { name, model } : undefined
      })
      .filter((item): item is FileItemCollectionItem => item !== undefined)
  }

  if (!collectionModel || typeof collectionModel !== "object") return []

  return Object.entries(collectionModel as Record<string, unknown>)
    .map(([itemName, itemModel]): FileItemCollectionItem | undefined => {
      if (!itemModel || typeof itemModel !== "object") return { name: itemName, model: { name: itemName } }
      return { name: itemName, model: { ...(itemModel as Record<string, unknown>), name: itemName } }
    })
    .filter((item): item is FileItemCollectionItem => item !== undefined)
}

export function resolveChildCollectionDir(dir: ChildCollectionDir, name: string, parentName?: string): string {
  return typeof dir === "function" ? dir({ name, parentName }) : dir
}

export async function listYAMLFileItemNames(params: {
  nkdkDir: string
  childCollection: FileItemChildCollection
  parentName: string
}): Promise<string[]> {
  if (params.childCollection.nkdkDir === undefined) return []

  const childDir = resolveChildCollectionDir(params.childCollection.nkdkDir, "", params.parentName)
  const collectionDir = join(params.nkdkDir, childDir)
  if (!fs.existsSync(collectionDir)) return []

  const entries = await fs.promises.readdir(collectionDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory() && fs.existsSync(join(collectionDir, entry.name, PROPERTIES_YAML)))
    .map((entry) => entry.name)
    .sort(compareNamesRu)
}

export function orderFileItemNames(params: { currentNames: string[]; referenceNames?: string[] }): string[] {
  const remaining = new Set(params.currentNames)
  const orderedExisting = (params.referenceNames ?? []).filter((name) => remaining.delete(name))
  const newNames = [...remaining].sort(compareNamesRu)
  return [...orderedExisting, ...newNames]
}

export function toChildObjectsXMLValue(names: string[]): string | string[] | undefined {
  if (names.length === 0) return undefined
  return names.length === 1 ? names[0] : names
}

function compareNamesRu(a: string, b: string): number {
  return a.localeCompare(b, "ru")
}
