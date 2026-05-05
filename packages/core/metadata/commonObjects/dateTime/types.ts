import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration"

const russianDateTimePattern =
  "^(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.[0-9]{4}( ([01][0-9]|2[0-3]):[0-5][0-9])?$"

export const DateTimeJSONSchema = Type.String({ pattern: russianDateTimePattern })

export type DateTimeYAML = Static<typeof DateTimeJSONSchema>

export interface DateTimePropertyRule extends BasePropertyRule {
  type: "dateTime"
  /** Выгружать дату/время с указанием типа: `xsi:type="xs:dateTime"` */
  typedXML?: true
}
