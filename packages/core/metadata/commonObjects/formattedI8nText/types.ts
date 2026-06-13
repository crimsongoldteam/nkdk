import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration/property/types"
import { StringboolXML } from "../boolean/types"
import { I8nText, I8nTextJSONSchema, I8nTextXML, I8nTextYAML } from "../i8nText/types"

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

/** Temporary legacy runtime type; switch to `FormattedI8nTextValueYAML` during YAML migration. */
export type FormattedI8nTextYAML = I8nTextYAML

export interface FormattedI8nTextXML extends I8nTextXML {
  _formatted?: StringboolXML
}

export interface FormattedI8nTextPropertyRule extends BasePropertyRule {
  type: "FormattedI8nText"
  /** Legacy bridge for Task 2-3; removed after YAML import/export migration. */
  yamlFormatted: string
  xmlWithDefaultLanguage?: true
}
