import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { isMetadataRootName, rootFromYAML } from "../metadataTargets/roots"
import { MetadataFieldTypeFromYAML, MetadataFieldTypeToYAML } from "../metadataPath/types"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataObjectStringToYAML } from "../metadataPath/toYAML"
import { MetadataItemLink, MetadataItemLinkYAML, MetadataItemLinks, MetadataItemLinksYAML } from "./types"

const toRoleYAML = (rule: { roleReferenceYAML?: "full" | "name" } | undefined, value: string): string => {
  if (rule?.roleReferenceYAML !== "name") return value
  return value.startsWith("Role.") ? value.slice("Role.".length) : value
}

export const exportMetadataItemLinkToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined
): MetadataItemLinkYAML | undefined => {
  if (data === undefined) return undefined
  if (data === "") return ""

  const roleAwareValue = toRoleYAML(rule, data)
  if (roleAwareValue !== data) return roleAwareValue

  try {
    const exported = exportMetadataObjectStringToYAML(context, rule, roleAwareValue)
    if (exported === undefined && rule?.roleReferenceYAML === "name") {
      if (canPassThroughShortRoleValue(roleAwareValue)) return roleAwareValue
      throwUnknownRoot(roleAwareValue)
    }

    return exported
  } catch (error) {
    if (rule?.roleReferenceYAML === "name" && canPassThroughShortRoleValue(roleAwareValue)) return roleAwareValue
    throw error
  }
}

export const exportMetadataItemLinksToYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinks | undefined
): MetadataItemLinksYAML | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToYAML(_context, rule, item)!)
}

registerTypeRule("MetadataItemLink", "exportToYAML", exportMetadataItemLinkToYAML)
registerTypeRule("MetadataItemLinks", "exportToYAML", exportMetadataItemLinksToYAML)

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
