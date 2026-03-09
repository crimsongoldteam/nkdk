import { MetadataItemType } from "~/metadata/orchestration/metadataItem/registry"
import { PropertyRuleType, PropertyToMetadata } from "~/metadata/orchestration/property/registry"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../property/types"

/** Тип системного перечисления по имени typeSE (обращение по имени через SE[`${name}ToYAML`]). */
type SETypeByName<Name extends string> = `${Name}ToYAML` extends keyof typeof SE
  ? keyof (typeof SE)[`${Name}ToYAML`]
  : unknown

export type EventsByRule<
  Rule extends { events?: Record<string, string> },
  Tag extends string | undefined = undefined,
> = "events" extends keyof Rule
  ? Rule["events"] extends infer Events
    ? Events extends undefined
      ? {}
      : Rule extends { eventsTag?: infer ET }
        ? Tag extends undefined
          ? { events?: { [K in keyof Events]?: string } }
          : ET extends Tag
            ? { events?: { [K in keyof Events]?: string } }
            : {}
        : { events?: { [K in keyof Events]?: string } }
    : {}
  : {}

/** Тип значения свойства в метаданных по правилу свойства */
type PropertyValueByRule<P extends PropertyRule> = P extends {
  type: "SystemEnumeration"
  typeSE: infer TypeSE
}
  ? TypeSE extends string
    ? SETypeByName<TypeSE>
    : unknown
  : P extends { type: infer PropertyType }
    ? PropertyType extends PropertyRuleType
      ? PropertyToMetadata<PropertyType>
      : unknown
    : unknown

/** Ключи свойств, отфильтрованные по Tag (все ключи при Tag === undefined) */
type FilteredKeys<Properties, Tag extends string | undefined> = {
  [K in keyof Properties]: [Tag] extends [undefined]
    ? K
    : Properties[K] extends { tag: Tag }
      ? K
      : never
}[keyof Properties] &
  keyof Properties

export type MetadataTypeByRule<
  Rule extends {
    properties: Record<string, PropertyRule>
    itemType: MetadataItemType
    events?: Record<string, string>
    eventsTag?: string
  },
  Tag extends string | undefined = undefined,
> = (Rule["properties"] extends infer Properties
  ? Properties extends Record<string, PropertyRule>
    ? {
        /** Обязательные поля (required: true в правиле) */
        -readonly [K in FilteredKeys<Properties, Tag> as Properties[K] extends {
          required: true
        }
          ? K
          : never]: PropertyValueByRule<Properties[K]>
      } & {
        /** Необязательные поля */
        -readonly [K in FilteredKeys<Properties, Tag> as Properties[K] extends {
          required: true
        }
          ? never
          : K]?: PropertyValueByRule<Properties[K]>
      }
    : never
  : never) &
  EventsByRule<Rule, Tag> & {
    // name: string
    itemType: Rule["itemType"]
  }
