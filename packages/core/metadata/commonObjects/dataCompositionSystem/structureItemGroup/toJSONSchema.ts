import { Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { exportPropertiesToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { GroupItemAutoRules } from "./items/groupItemAuto/rules"
import { GroupItemFieldRules } from "./items/groupItemField/rules"
import { StructureItemGroupRules } from "./rules"

export const exportGroupItemAutoToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: GroupItemAutoRules })

export const exportGroupItemFieldToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: GroupItemFieldRules })

export const exportStructureItemGroupToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const groupItemsProperties = exportPropertiesToJSONSchema({
    context,
    rule: {
      ...StructureItemGroupRules,
      properties: {
        groupItems: StructureItemGroupRules.properties.groupItems,
      },
    },
  })
  const itemYamlKey = StructureItemGroupRules.properties.item.yaml

  return Type.Recursive((This) =>
    Type.Object(
      {
        ...groupItemsProperties,
        [itemYamlKey]: Type.Optional(This),
      },
      { additionalProperties: false }
    )
  )
}

export const exportStructureItemGroupCollectionToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  Type.Array(
    Type.Union([
      exportGroupItemAutoToJSONSchema({ context, rule: { type: "GroupItemAuto" } as never }),
      exportGroupItemFieldToJSONSchema({ context, rule: { type: "GroupItemField" } as never }),
    ])
  )

registerTypeRule("GroupItemAuto", "exportToJSONSchema", exportGroupItemAutoToJSONSchema)
registerTypeRule("GroupItemField", "exportToJSONSchema", exportGroupItemFieldToJSONSchema)
registerTypeRule("StructureItemGroup", "exportToJSONSchema", exportStructureItemGroupToJSONSchema)
registerTypeRule("StructureItemGroupCollection", "exportToJSONSchema", exportStructureItemGroupCollectionToJSONSchema)
