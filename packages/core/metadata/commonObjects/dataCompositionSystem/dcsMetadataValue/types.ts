import { BasePropertyRule } from "~/metadata/orchestration"

export interface DcsMetadataValuePropertyRule extends BasePropertyRule {
  type: "MetadataDcsMetadataValue"
  valueType: "Color" | "Field" | "Parameter" | "DesignTimeValue" | "Primitive"
}
