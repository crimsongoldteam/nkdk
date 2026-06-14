import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration/property/types"
import { StringboolXML } from "../boolean/types"
import { I8nText, I8nTextJSONSchema, I8nTextXML } from "../i8nText/types"

export interface FormattedI8nText extends I8nText {
  formatted: boolean
  items: Record<string, string>
}

export const FormattedI8nTextJSONSchema = Type.Object(
  {
    Форматированный: Type.Optional(Type.Literal("Истина")),
    Текст: I8nTextJSONSchema,
  },
  { additionalProperties: false }
)

export type FormattedI8nTextValueYAML = Static<typeof FormattedI8nTextJSONSchema>
export type FormattedI8nTextYAML = FormattedI8nTextValueYAML

export interface FormattedI8nTextXML extends I8nTextXML {
  _formatted?: StringboolXML
}

export interface FormattedI8nTextPropertyRule extends BasePropertyRule {
  type: "FormattedI8nText"
  xmlWithDefaultLanguage?: true
}
