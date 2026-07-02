import { UserVisibleYAML } from "../../commonObjects/userVisible/types"
import { MetadataItemType } from "./registry"
import { PropertyRuleType, PropertyToYAML } from "../property/registry"
import * as SE from "../../systemEnumerations/types"
import { PropertyRule } from "../property/types"

/**
 * YAML-представление неявного значения (с учётом преобразований).
 * Используется для исключения implicitValueYAML из типа YAML — допускается отсутствие ключа или значение, отличное от неявного.
 */
type ImplicitValueToYAML<PropertyType extends PropertyRuleType, ImplicitValue> = PropertyType extends "boolean"
  ? ImplicitValue extends true
    ? "Истина"
    : ImplicitValue extends false
      ? "Ложь"
      : never
  : PropertyType extends "number" | "string"
    ? ImplicitValue
    : PropertyType extends "SystemEnumeration"
      ? ImplicitValue extends string
        ? ImplicitValue
        : never
      : never

type ValueTypeWithImplicit<Base, P, PropertyType extends PropertyRuleType> = P extends {
  implicitValueYAML: infer D
}
  ? D extends (...args: any[]) => any
    ? Base
    : Exclude<Base, ImplicitValueToYAML<PropertyType, D>>
  : Base

type SystemEnumerationYAMLValueTypeByRule<P, TypeSE extends string> = ValueTypeWithImplicit<
  SETypeByName<TypeSE>,
  P,
  "SystemEnumeration"
>

type PropertyYAMLValueType<P> = P extends { type: "SystemEnumeration"; typeSE: infer TypeSE }
  ? TypeSE extends string
    ? SystemEnumerationYAMLValueTypeByRule<P, TypeSE>
    : unknown
  : P extends { type: infer PropertyType }
    ? PropertyType extends PropertyRuleType
      ? ValueTypeWithImplicit<PropertyToYAML<PropertyType>, P, PropertyType>
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
        [K in keyof Properties as Properties[K] extends { runtimeOnly: true }
          ? never
          : Properties[K] extends { syncExternalOnly: true }
            ? never
            : Properties[K] extends { toYAML: false; fromYAML: false }
              ? never
              : Properties[K] extends { toPartialYAML: false }
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
    ? P extends { type: "UserVisible"; yaml?: infer Y }
      ? Y extends string
        ? Y
        : never
      : never
    : never]?: UserVisibleYAML
}

type EventsByRule<Rule extends { events?: Record<string, string> }> = "events" extends keyof Rule
  ? Rule["events"] extends infer Events
    ? { События?: { [K in Extract<Events[keyof Events], string>]?: string } }
    : {}
  : {}
