import * as SE from "~/metadata/systemEnumerations/types"
import { FormElementType } from "../metadataType/types"
import { PropertyRule } from "../properties/types"
import { ElementTypeByKey, TypeRulesNamesNew } from "./types"

/** Тип системного перечисления по имени typeSE (обращение по имени через SE[`${name}ToYAML`]). */
type SETypeByName<Name extends string> = `${Name}ToYAML` extends keyof typeof SE
  ? keyof (typeof SE)[`${Name}ToYAML`]
  : unknown

export type ElementTypeByRule<
  Rule extends { properties: Record<string, PropertyRule>; itemType: FormElementType; events?: Record<string, string> },
> = (Rule["properties"] extends infer Properties
  ? {
      [K in keyof Properties]?: Properties[K] extends { type: "SystemEnumeration"; typeSE: infer TypeSE }
        ? TypeSE extends string
          ? SETypeByName<TypeSE>
          : unknown
        : Properties[K] extends { type: infer PropertyType }
          ? PropertyType extends TypeRulesNamesNew
            ? ElementTypeByKey<PropertyType>
            : unknown
          : unknown
    }
  : never) &
  (Rule["events"] extends infer Events
    ? {
        [K in keyof Events]?: string
      }
    : {}) & {
    name: string
    itemType: Rule["itemType"]
  }
