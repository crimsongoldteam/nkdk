import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { ClientApplicationFormRule } from "~/metadata/metadataFactory/form/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  AutoSaveFormDataInSettingsFromYAML,
  ChildFormItemsGroupFromYAML,
  ChildFormItemsWidthFromYAML,
  ChoiceModeFromYAML,
  CollapseFormItemsByImportanceFromYAML,
  EnterKeyBehaviorTypeFromYAML,
  FoldersAndItemsUseFromYAML,
  FormCommandBarLabelLocationFromYAML,
  FormConversationsRepresentationFromYAML,
  FormItemSpacingFromYAML,
  FormWindowOpeningModeFromYAML,
  ItemHorizontalLocationFromYAML,
  ItemVerticalAlignFromYAML,
  ItemsAndTitlesAlignVariantFromYAML,
  SaveFormDataInSettingsFromYAML,
  UsedServerFromYAML,
  VerticalFormScrollFromYAML,
} from "~/metadata/systemEnumerations/types"
import { ClientApplicationFormRules } from "./rules"

/** Реестр YAML-значений для SystemEnumeration по имени typeSE (для полей формы приложения). */
const SE_YAML_VALUES: Record<string, readonly string[]> = {
  AutoSaveFormDataInSettings: Object.keys(AutoSaveFormDataInSettingsFromYAML) as string[],
  ItemHorizontalLocation: Object.keys(ItemHorizontalLocationFromYAML) as string[],
  ItemVerticalAlign: Object.keys(ItemVerticalAlignFromYAML) as string[],
  CollapseFormItemsByImportance: Object.keys(CollapseFormItemsByImportanceFromYAML) as string[],
  FormCommandBarLabelLocation: Object.keys(FormCommandBarLabelLocationFromYAML) as string[],
  FormConversationsRepresentation: Object.keys(FormConversationsRepresentationFromYAML) as string[],
  EnterKeyBehaviorType: Object.keys(EnterKeyBehaviorTypeFromYAML) as string[],
  FormWindowOpeningMode: Object.keys(FormWindowOpeningModeFromYAML) as string[],
  ChildFormItemsGroup: Object.keys(ChildFormItemsGroupFromYAML) as string[],
  FormItemSpacing: Object.keys(FormItemSpacingFromYAML) as string[],
  ItemsAndTitlesAlignVariant: Object.keys(ItemsAndTitlesAlignVariantFromYAML) as string[],
  SaveFormDataInSettings: Object.keys(SaveFormDataInSettingsFromYAML) as string[],
  ChildFormItemsWidth: Object.keys(ChildFormItemsWidthFromYAML) as string[],
  UsedServer: Object.keys(UsedServerFromYAML) as string[],
  VerticalFormScroll: Object.keys(VerticalFormScrollFromYAML) as string[],
  FoldersAndItemsUse: Object.keys(FoldersAndItemsUseFromYAML) as string[],
  ChoiceMode: Object.keys(ChoiceModeFromYAML) as string[],
}

/** Сложные типы формы — в схеме задаём заглушку (объект с дополнительными свойствами). */
const COMPLEX_TYPES = new Set([
  "FormAttributes",
  "AutoCommandBar",
  "ChildItems",
  "CommandInterface",
  "CommandSet",
  "FormCommands",
  "FormParameters",
  "ChoiceParameters",
  "UsePurposes",
])

function propertyRuleToSchema(rule: PropertyRule): TSchema {
  if ("type" in rule) {
    switch (rule.type) {
      case "boolean":
        return Type.Boolean()
      case "string":
        return Type.String()
      case "number":
        return Type.Number()
      case "I8nText":
        return Type.Union([Type.String(), Type.Record(Type.String(), Type.String())] as [TSchema, TSchema])
      case "SystemEnumeration": {
        const typeSE = "typeSE" in rule ? rule.typeSE : undefined
        const values = typeSE ? SE_YAML_VALUES[typeSE] : undefined
        if (values && values.length > 0) {
          if (values.length === 1) {
            return Type.Literal(values[0])
          }
          const literals = values.map((v) => Type.Literal(v)) as TSchema[]
          return Type.Union(literals as [TSchema, TSchema, ...TSchema[]])
        }
        return Type.String()
      }
      default:
        if (COMPLEX_TYPES.has(rule.type as string)) {
          return Type.Object({}, { additionalProperties: true })
        }
        return Type.Object({}, { additionalProperties: true })
    }
  }
  return Type.Object({}, { additionalProperties: true })
}

/**
 * Строит JSON Schema для YAML-представления формы приложения по правилам.
 * Ключи в схеме — YAML-ключи (rule.yaml), включая секцию «События».
 */
export function buildClientApplicationFormJsonSchema(rules: ClientApplicationFormRule): TSchema {
  const properties: Record<string, TSchema> = {}

  for (const [_propKey, rule] of Object.entries(rules.properties)) {
    const yamlKey = rule?.yaml
    if (!yamlKey) continue
    properties[yamlKey] = propertyRuleToSchema(rule as PropertyRule)
  }

  if (rules.events && Object.keys(rules.events).length > 0) {
    const eventProps: Record<string, TSchema> = {}
    for (const yamlKey of Object.values(rules.events)) {
      eventProps[yamlKey as string] = Type.String()
    }
    properties["События"] = Type.Object(eventProps, { additionalProperties: false })
  }

  const schema = Type.Object(properties, { additionalProperties: false })
  return { ...schema, $schema: "http://json-schema.org/draft-07/schema#" } as TSchema
}

/** Готовая JSON Schema для формы приложения (ClientApplicationFormRules). */
export const ClientApplicationFormJsonSchema = buildClientApplicationFormJsonSchema(ClientApplicationFormRules)
