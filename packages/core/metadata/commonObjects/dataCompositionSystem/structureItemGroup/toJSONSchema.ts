import { TSchema, Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { GroupItemFieldRules } from "./items/groupItemField/rules"

const requiredSchema = (schema: TSchema | undefined, name: string): TSchema => {
  if (schema === undefined) throw new Error(`${name} JSON schema is not registered`)
  return schema
}

const groupItemAutoRule = { type: "GroupItemAuto" } as const satisfies PropertyRule
const groupItemFieldRule = { type: "GroupItemField" } as const satisfies PropertyRule

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
      requiredSchema(
        exportGroupItemAutoToJSONSchema({ context, rule: groupItemAutoRule, value: undefined }),
        "GroupItemAuto"
      ),
      requiredSchema(
        exportGroupItemFieldToJSONSchema({ context, rule: groupItemFieldRule, value: undefined }),
        "GroupItemField"
      ),
    ]),
    { minItems: 1 }
  )

export const exportStructureItemGroupToJSONSchema: ExportToJSONSchemaFn = exportStructureItemGroupCollectionToJSONSchema

registerTypeRule("GroupItemAuto", "exportToJSONSchema", exportGroupItemAutoToJSONSchema)
registerTypeRule("GroupItemField", "exportToJSONSchema", exportGroupItemFieldToJSONSchema)
registerTypeRule("StructureItemGroup", "exportToJSONSchema", exportStructureItemGroupToJSONSchema)
registerTypeRule("StructureItemGroupCollection", "exportToJSONSchema", exportStructureItemGroupCollectionToJSONSchema)
