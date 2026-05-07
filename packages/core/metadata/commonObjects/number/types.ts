import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration"

export const NumberJSONSchema = Type.Number()

export type NumberYAML = Static<typeof NumberJSONSchema>

export interface NumberPropertyRule extends BasePropertyRule {
  type: "number"
  /** Выгружать число с указанием `xsi:type`. `true` сохраняет старое поведение: `xs:decimal`. */
  typedXML?: true | "xs:decimal" | "xs:string"
}
