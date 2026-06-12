import { Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { GroupItemFieldRules } from "./items/groupItemField/rules"

export const exportGroupItemAutoToJSONSchema: ExportToJSONSchemaFn = () =>
  Type.Union([Type.Literal("[Авто]"), Type.Literal("([Авто])")])

const GroupItemFieldShortJSONSchema = Type.String({ pattern: "^(?!\\(\\)$).+$" })

export const exportGroupItemFieldToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  Type.Union([
    GroupItemFieldShortJSONSchema,
    Type.Object(
      {
        Поле: Type.String({ minLength: 1 }),
        Использование: Type.Optional(Type.Literal("Ложь")),
        ТипГруппировки: Type.Optional(
          exportPropertyToJSONSchema({
            context,
            rule: GroupItemFieldRules.properties.groupType,
            value: undefined,
          }) ?? Type.Never()
        ),
        ТипДополнения: Type.Optional(
          exportPropertyToJSONSchema({
            context,
            rule: GroupItemFieldRules.properties.periodAdditionType,
            value: undefined,
          }) ?? Type.Never()
        ),
        НачалоПериода: Type.Optional(
          exportPropertyToJSONSchema({
            context,
            rule: GroupItemFieldRules.properties.periodAdditionBegin,
            value: undefined,
          }) ?? Type.Never()
        ),
        КонецПериода: Type.Optional(
          exportPropertyToJSONSchema({
            context,
            rule: GroupItemFieldRules.properties.periodAdditionEnd,
            value: undefined,
          }) ?? Type.Never()
        ),
      },
      { additionalProperties: false }
    ),
  ])

export const exportStructureItemGroupCollectionToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  Type.Array(
    Type.Union([
      exportGroupItemAutoToJSONSchema({ context, rule: { type: "GroupItemAuto" } as never }),
      exportGroupItemFieldToJSONSchema({ context, rule: { type: "GroupItemField" } as never }),
    ]),
    { minItems: 1 }
  )

export const exportStructureItemGroupToJSONSchema: ExportToJSONSchemaFn = exportStructureItemGroupCollectionToJSONSchema

registerTypeRule("GroupItemAuto", "exportToJSONSchema", exportGroupItemAutoToJSONSchema)
registerTypeRule("GroupItemField", "exportToJSONSchema", exportGroupItemFieldToJSONSchema)
registerTypeRule("StructureItemGroup", "exportToJSONSchema", exportStructureItemGroupToJSONSchema)
registerTypeRule("StructureItemGroupCollection", "exportToJSONSchema", exportStructureItemGroupCollectionToJSONSchema)
