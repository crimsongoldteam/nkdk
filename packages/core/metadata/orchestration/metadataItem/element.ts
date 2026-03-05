import { MetadataItemType } from "~/metadata/orchestration/metadataItem/registry"
import { PropertyRuleType, PropertyToMetadata } from "~/metadata/orchestration/property/registry"
import * as SE from "~/metadata/systemEnumerations/types"

/** Тип системного перечисления по имени typeSE (обращение по имени через SE[`${name}ToYAML`]). */
type SETypeByName<Name extends string> = `${Name}ToYAML` extends keyof typeof SE
  ? keyof (typeof SE)[`${Name}ToYAML`]
  : unknown

export type ElementTypeByRule<
  Rule extends {
    properties: Record<string, PropertyRuleType>
    itemType: MetadataItemType
    events?: Record<string, string>
  },
> = (Rule["properties"] extends infer Properties
  ? {
      [K in keyof Properties]?: Properties[K] extends { type: "SystemEnumeration"; typeSE: infer TypeSE }
        ? TypeSE extends string
          ? SETypeByName<TypeSE>
          : unknown
        : Properties[K] extends { type: infer PropertyType }
          ? PropertyType extends PropertyRuleType
            ? PropertyToMetadata<PropertyType>
            : unknown
          : unknown
    }
  : never) &
  ("events" extends keyof Rule
    ? Rule["events"] extends infer Events
      ? Events extends undefined
        ? {}
        : { events?: { [K in keyof Events]?: string } }
      : {}
    : {}) & {
    name: string
    itemType: Rule["itemType"]
  }
