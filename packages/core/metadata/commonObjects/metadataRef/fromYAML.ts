import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration"
import type { ImportFromYAMLFunctionNew } from "~/metadata/orchestration/property/fn"
import { isMetadataRootName, rootFromYAML } from "../metadataTargets/roots"
import { MetadataFieldTypeFromYAML, MetadataFieldTypeToYAML } from "../metadataPath/types"
import { ConfigurationContext } from "../../context/types"
import type { MetadataTargetOwner } from "../metadataTargets/types"
import { importMetadataObjectStringFromYAML } from "../metadataPath/fromYAML"
import { MetadataItemLink, MetadataItemLinkYAML, MetadataItemLinks, MetadataItemLinksYAML } from "./types"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const fromRoleYAML = (rule: { roleReferenceYAML?: "full" | "name" } | undefined, value: string): string => {
  if (rule?.roleReferenceYAML !== "name") return value
  if (value.startsWith("Role.")) return value
  if (value.includes(".")) return value
  if (UUID_PATTERN.test(value)) return value
  return `Role.${value}`
}

export const importMetadataItemLinkFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinkYAML | undefined,
  owner?: MetadataTargetOwner
): MetadataItemLink | undefined => {
  if (data === undefined) return undefined
  if (data === "") return ""

  const roleAwareValue = fromRoleYAML(rule, data)
  if (roleAwareValue !== data) return roleAwareValue
  if (rule?.roleReferenceYAML === "name" && UUID_PATTERN.test(data)) return data

  try {
    const imported = importMetadataObjectStringFromYAML(context, rule, roleAwareValue, owner)
    if (imported === undefined && rule?.roleReferenceYAML === "name") {
      if (canPassThroughShortRoleValue(roleAwareValue)) return roleAwareValue
      throwUnknownRoot(roleAwareValue)
    }

    return imported
  } catch (error) {
    if (rule?.roleReferenceYAML === "name" && canPassThroughShortRoleValue(roleAwareValue)) return roleAwareValue
    throw error
  }
}

export const importMetadataItemLinksFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinksYAML | undefined,
  owner?: MetadataTargetOwner
): MetadataItemLinks | undefined => {
  if (!data) return undefined

  return data
    .map((item) => importMetadataItemLinkFromYAML(context, rule, item, owner)!)
    .filter((item): item is MetadataItemLink => item !== undefined)
}

const importMetadataItemLinkFromYAMLProperty: ImportFromYAMLFunctionNew = (params) =>
  importMetadataItemLinkFromYAML(params.context, params.rule, params.value, params.owner)

const importMetadataItemLinksFromYAMLProperty: ImportFromYAMLFunctionNew = (params) =>
  importMetadataItemLinksFromYAML(params.context, params.rule, params.value, params.owner)

registerTypeRule("MetadataItemLink", "importFromYAML", importMetadataItemLinkFromYAMLProperty)
registerTypeRule("MetadataItemLinks", "importFromYAML", importMetadataItemLinksFromYAMLProperty)

function canPassThroughShortRoleValue(value: string): boolean {
  const root = value.split(".")[0]
  return root === "Role" || !isMetadataLikeRoot(root)
}

function isMetadataLikeRoot(root: string): boolean {
  return (
    rootFromYAML[root] !== undefined ||
    isMetadataRootName(root) ||
    Object.prototype.hasOwnProperty.call(MetadataFieldTypeFromYAML, root) ||
    Object.prototype.hasOwnProperty.call(MetadataFieldTypeToYAML, root)
  )
}

function throwUnknownRoot(value: string): never {
  throw new Error(`Неизвестный корень "${value.split(".")[0]}"`)
}
