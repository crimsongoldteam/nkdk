import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration"

export const NumberJSONSchema = Type.Number()

export type NumberYAML = Static<typeof NumberJSONSchema>

export interface NumberPropertyRule extends BasePropertyRule {
  type: "number"
  /** Выгружать число с указанием типа: `xsi:type="xs:decimal"` */
  typedXML?: true
}
