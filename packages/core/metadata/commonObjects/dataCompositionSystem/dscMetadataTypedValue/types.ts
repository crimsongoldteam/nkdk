import { BasePropertyRule } from "~/metadata/orchestration"

export interface DcsMetadataTypedValuePropertyRule extends BasePropertyRule {
  type: "DcsMetadataTypedValue"
}

export type DcsMetadataTypedValueRegistryItem = {
  detect: (yaml: any) => boolean
  fromYAML: (yaml: any) => any
  fromXML: (xml: any) => any
  toYAML: (item: any) => any
  toXML: (item: any) => any
}

export const DcsMetadataTypedValueRegistry: Record<string, DcsMetadataTypedValueRegistryItem> = {
  Field: {},
}
