import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { MetadataItemType } from "~/metadata/orchestration/metadataItem/registry"
import { PropertyRuleType, PropertyToYAML } from "~/metadata/orchestration/property/registry"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../property/types"

/**
 * YAML-представление значения по умолчанию (с учётом преобразований).
 * Используется для исключения defaultValue из типа YAML — в YAML допускается только отсутствие ключа или значение, отличное от default.
 */
type DefaultValueToYAML<PropertyType extends PropertyRuleType, DefaultValue> = PropertyType extends "boolean"
  ? DefaultValue extends true
    ? "Истина"
    : DefaultValue extends false
      ? "Ложь"
      : never
  : PropertyType extends "number" | "string"
    ? DefaultValue
    : PropertyType extends "SystemEnumeration"
      ? DefaultValue extends string
        ? DefaultValue
        : never
      : never

type ValueTypeWithDefault<Base, P, PropertyType extends PropertyRuleType> = P extends {
  defaultValue: infer D
}
  ? D extends (...args: any[]) => any
    ? Base
    : Exclude<Base, DefaultValueToYAML<PropertyType, D>>
  : Base

type PropertyYAMLValueType<P> = P extends { type: "SystemEnumeration"; typeSE: infer TypeSE }
  ? TypeSE extends string
    ? ValueTypeWithDefault<SETypeByName<TypeSE>, P, "SystemEnumeration">
    : unknown
  : P extends { type: infer PropertyType }
    ? PropertyType extends PropertyRuleType
      ? ValueTypeWithDefault<PropertyToYAML<PropertyType>, P, PropertyType>
      : unknown
    : unknown

export type YAMLTypeByRule<
  Rule extends {
    properties: Record<string, PropertyRule>
    itemType: MetadataItemType
    events?: Record<string, string>
  },
> = PropertiesByRule<Rule> & UserVisibleByRule<Rule> & EventsByRule<Rule>

type PropertiesByRule<Rule extends { properties: Record<string, PropertyRule> }> =
  Rule["properties"] extends infer Properties
    ? {
        [K in keyof Properties as Properties[K] extends { toYAML: false; fromYAML: false }
          ? never
          : Properties[K] extends { yaml: infer YAMLName }
            ? YAMLName extends string
              ? YAMLName
              : never
            : never]?: Properties[K] extends {
          type: "SystemEnumeration"
          typeSE: infer TypeSE
        }
          ? TypeSE extends string
            ? PropertyYAMLValueType<Properties[K]>
            : unknown
          : Properties[K] extends { type: infer PropertyType }
            ? PropertyType extends PropertyRuleType
              ? PropertyYAMLValueType<Properties[K]>
              : unknown
            : unknown
      }
    : never

type SETypeByName<Name extends string> = `${Name}FromYAML` extends keyof typeof SE
  ? keyof (typeof SE)[`${Name}FromYAML`]
  : unknown

type UserVisibleByRule<Rule extends { properties: Record<string, PropertyRule> }> = {
  [K in Rule["properties"][keyof Rule["properties"]] extends infer P
    ? P extends { type: "UserVisible"; yaml?: infer Y; yamlDeny?: infer YD }
      ? (Y extends string ? Y : never) | (YD extends string ? YD : never)
      : never
    : never]?: UserVisibleYAML
}

type EventsByRule<Rule extends { events?: Record<string, string> }> = "events" extends keyof Rule
  ? Rule["events"] extends infer Events
    ? { События?: { [K in Extract<Events[keyof Events], string>]?: string } }
    : {}
  : {}
