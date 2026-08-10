import { TSchema, Type } from "typebox"
import { ExportToJSONSchemaFn, PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import { exportPropertyToJSONSchema } from "../../../ruleRuntime/property/toJSONSchema"
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

export const metadataPropertyRule000 = definePropertyTypeRule("GroupItemAuto", "exportToJSONSchema", exportGroupItemAutoToJSONSchema)
export const metadataPropertyRule001 = definePropertyTypeRule("GroupItemField", "exportToJSONSchema", exportGroupItemFieldToJSONSchema)
export const metadataPropertyRule002 = definePropertyTypeRule("StructureItemGroup", "exportToJSONSchema", exportStructureItemGroupToJSONSchema)
export const metadataPropertyRule003 = definePropertyTypeRule("StructureItemGroupCollection", "exportToJSONSchema", exportStructureItemGroupCollectionToJSONSchema)
