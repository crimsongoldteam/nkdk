import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"
import {
  StandardPeriodVariant,
  StandardPeriodVariantFromYAML,
  StandardPeriodVariantYAML,
} from "../../systemEnumerations/types"

const russianDateTimeWithSecondsPattern =
  "^(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.[0-9]{4} ([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
const standardPeriodVariants = Object.keys(StandardPeriodVariantFromYAML).map((variant) => Type.Literal(variant))

export interface StandardPeriod {
  variant: StandardPeriodVariant
  startDate?: string
  endDate?: string
}

export interface StandardPeriodXML {
  "_xsi:type": "v8:StandardPeriod"
  "v8:variant": {
    "_xsi:type": "v8:StandardPeriodVariant"
    "#text": StandardPeriodVariant
  }
  "v8:startDate"?: string
  "v8:endDate"?: string
}

export const StandardPeriodYAMLJSONSchema = Type.Object({
  Вариант: Type.Union(standardPeriodVariants),
  ДатаНачала: Type.Optional(Type.String({ pattern: russianDateTimeWithSecondsPattern })),
  ДатаОкончания: Type.Optional(Type.String({ pattern: russianDateTimeWithSecondsPattern })),
})

export interface StandardPeriodYAML extends Static<typeof StandardPeriodYAMLJSONSchema> {
  Вариант: StandardPeriodVariantYAML
}
