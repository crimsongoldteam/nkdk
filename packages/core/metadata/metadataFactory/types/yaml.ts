import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../properties/types"
import { TypeRulesNamesNew, YAMLTypeByKey } from "./types"
import { MetadataType } from "../metadataType/types"

export type YAMLTypeByRule<
  Rule extends {
    properties: Record<string, PropertyRule>
    itemType: MetadataType
    events?: Record<string, string>
  },
> = PropertiesByRule<Rule> & UserVisibleByRule<Rule> & EventsByRule<Rule>

type PropertiesByRule<Rule extends { properties: Record<string, PropertyRule> }> =
  Rule["properties"] extends infer Properties
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

export type EventsByRule<Rule extends { events?: Record<string, string> }> = "events" extends keyof Rule
  ? Rule["events"] extends infer Events
    ? { События?: { [K in Extract<Events[keyof Events], string>]?: string } }
    : {}
  : {}
