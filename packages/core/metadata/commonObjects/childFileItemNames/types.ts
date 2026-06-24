import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export interface ChildFileItemNamesPropertyRule extends BasePropertyRule {
  type: "ChildFileItemNames"
  xml: string
  forReferenceOnly: true
}
