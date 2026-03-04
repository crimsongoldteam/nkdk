import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { FormElementType } from "../metadataType/types"
import { PropertyRule } from "../properties/types"
import { TypeRulesNamesNew, YAMLTypeByKey } from "./types"

/** Тип системного перечисления по имени typeSE (обращение по имени через SE[`${name}ToYAML`]). */
type SETypeByName<Name extends string> = `${Name}FromYAML` extends keyof typeof SE
  ? keyof (typeof SE)[`${Name}FromYAML`]
  : unknown

/** Ключи YAML из свойств UserVisible (yaml и yamlDeny) → объект с полями UserVisibleYAML. */
export type YAMLUserVisibleByRule<Rule extends { properties: Record<string, PropertyRule> }> = {
  [K in Rule["properties"][keyof Rule["properties"]] extends infer P
    ? P extends { type: "UserVisible"; yaml?: infer Y; yamlDeny?: infer YD }
      ? (Y extends string ? Y : never) | (YD extends string ? YD : never)
      : never
    : never]?: UserVisibleYAML
}

export type YAMLTypeByRule<
  Rule extends { properties: Record<string, PropertyRule>; itemType: FormElementType; events?: Record<string, string> },
> = (Rule["properties"] extends infer Properties
  ? {
      [K in keyof Properties as Properties[K] extends { yaml: infer YAMLName }
        ? YAMLName extends string
          ? YAMLName
          : never
        : never]?: Properties[K] extends {
        type: "SystemEnumeration"
        typeSE: infer TypeSE
      }
        ? TypeSE extends string
          ? SETypeByName<TypeSE>
          : unknown
        : Properties[K] extends { type: infer PropertyType }
          ? PropertyType extends TypeRulesNamesNew
            ? YAMLTypeByKey<PropertyType>
            : unknown
          : unknown
    }
  : never) &
  YAMLUserVisibleByRule<Rule> &
  ("events" extends keyof Rule
    ? Rule["events"] extends infer Events
      ? "События" extends undefined
        ? {}
        : { events?: { [K in keyof Events]?: string } }
      : {}
    : {})
