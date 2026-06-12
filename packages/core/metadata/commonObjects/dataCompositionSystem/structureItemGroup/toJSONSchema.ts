import { Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { GroupItemAutoRules } from "./items/groupItemAuto/rules"
import { GroupItemFieldRules } from "./items/groupItemField/rules"
import { StructureItemGroupRules } from "./rules"

export const exportGroupItemAutoToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: GroupItemAutoRules })

export const exportGroupItemFieldToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: GroupItemFieldRules })

export const exportStructureItemGroupToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: StructureItemGroupRules })

export const exportStructureItemGroupCollectionToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  Type.Array(exportStructureItemGroupToJSONSchema({ context, rule: { type: "StructureItemGroup" } as never }))

registerTypeRule("GroupItemAuto", "exportToJSONSchema", exportGroupItemAutoToJSONSchema)
registerTypeRule("GroupItemField", "exportToJSONSchema", exportGroupItemFieldToJSONSchema)
registerTypeRule("StructureItemGroup", "exportToJSONSchema", exportStructureItemGroupToJSONSchema)
registerTypeRule("StructureItemGroupCollection", "exportToJSONSchema", exportStructureItemGroupCollectionToJSONSchema)
