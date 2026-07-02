import { Type } from "@sinclair/typebox"
import type { Static } from "@sinclair/typebox"
import { StandardBeginningDateVariantFromYAML, type StandardBeginningDateVariant } from "../../systemEnumerations/types"

export interface StandartBeginningDate {
  variant: StandardBeginningDateVariant
  date?: string
}

const standardBeginningDateVariants = Object.keys(StandardBeginningDateVariantFromYAML).map((key) => Type.Literal(key))

// YAML хранит дату в формате "ДД.ММ.ГГГГ ЧЧ:ММ:СС" (время обязательно).
const russianDateTimePattern =
  "^(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.[0-9]{4} ([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"

export const StandartBeginningDateJSONSchema = Type.Object({
  Вариант: Type.Union(standardBeginningDateVariants),
  Дата: Type.Optional(Type.String({ pattern: russianDateTimePattern })),
})

export type StandartBeginningDateYAML = Static<typeof StandartBeginningDateJSONSchema>

export interface StandartBeginningDateXML {
  "_xsi:type"?: "v8:StandardBeginningDate"
  "v8:variant": {
    "_xsi:type"?: "v8:StandardBeginningDateVariant"
    "#text"?: StandardBeginningDateVariant
  }
  "v8:date"?: string
}
