import type { PropertyStateMode } from "../definition"

export const CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT = "configurationExtensionPropertyState"

export type ConfigurationExtensionPropertyStateFactMode = PropertyStateMode | "xml"

export interface ConfigurationExtensionPropertyStateFactPayload {
  readonly version: 1
  readonly itemType: string
  readonly propertyKey: string
  readonly mode: ConfigurationExtensionPropertyStateFactMode
  readonly value: unknown
}
