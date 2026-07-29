export type ConfigurationExtensionPurpose =
  | "customization"
  | "add-on"
  | "patch"

export type ConfigurationExtensionScope =
  | "infobase"
  | "data-separation"

export type ConfigurationExtensionInfo = {
  name: string
  version: string
  active: boolean
  purpose: ConfigurationExtensionPurpose
  safeMode: boolean
  securityProfileName: string
  unsafeActionProtection: boolean
  usedInDistributedInfobase: boolean
  scope: ConfigurationExtensionScope
  hashSum: string
}
