export * from "@nkdk/runtime/rule-kit"

import type { MetadataItemType, MetadataItemRule, PropertyRule, PropertyRuleType } from "@nkdk/runtime/rule-kit"
import type { PropertyToMetadata } from "../property/registry"
import type { SystemEnumerationToMetadata } from "../property/systemEnumerationRegistry"

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

type PropertyValueByRule<P extends PropertyRule> = P extends {
  type: "SystemEnumeration"
  typeSE: infer TypeSE
}
  ? TypeSE extends string
    ? SystemEnumerationToMetadata<TypeSE>
    : unknown
  : P extends { type: infer PropertyType }
    ? PropertyType extends PropertyRuleType
      ? PropertyToMetadata<PropertyType>
      : unknown
    : unknown

type FilteredKeys<Properties, Tag extends string | undefined> = {
  [K in keyof Properties]: Properties[K] extends { runtimeOnly: true }
    ? never
    : Properties[K] extends { syncExternalOnly: true }
      ? never
      : [Tag] extends [undefined]
        ? K
        : Properties[K] extends { tag: Tag }
          ? K
          : never
}[keyof Properties] & keyof Properties

type CommonMetadataTypeByRule<
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
        -readonly [K in FilteredKeys<Properties, Tag> as Properties[K] extends { required: true }
          ? K
          : never]: PropertyValueByRule<Properties[K]>
      } & {
        -readonly [K in FilteredKeys<Properties, Tag> as Properties[K] extends { required: true }
          ? never
          : K]?: PropertyValueByRule<Properties[K]>
      }
    : never
  : never) & EventsByRule<Rule, Tag> & { itemType: Rule["itemType"] }

export type MetadataTypeByRule<
  Rule extends {
    properties: Record<string, PropertyRule>
    itemType: MetadataItemType
    events?: Record<string, string>
    eventsTag?: string
  },
  Tag extends string | undefined = undefined,
> = CommonMetadataTypeByRule<Rule, Tag> & { uuid?: string }

export type FormTypeByRule<Rule extends MetadataItemRule> = CommonMetadataTypeByRule<Rule> & { id?: string }
