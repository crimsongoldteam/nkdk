import { BasePropertyRule } from "~/metadata/orchestration/property/types"
import { StringboolXML } from "../boolean/types"
import { I8nText, I8nTextJSONSchema, I8nTextXML, I8nTextYAML } from "../i8nText/types"

export interface FormattedI8nText extends I8nText {
  formatted: boolean
  items: Record<string, string>
}

/** Форматированный локализованный текст — в YAML совпадает с I8nText */
export const FormattedI8nTextJSONSchema = I8nTextJSONSchema
export type FormattedI8nTextYAML = I8nTextYAML

export interface FormattedI8nTextXML extends I8nTextXML {
  _formatted?: StringboolXML
}

export interface FormattedI8nTextPropertyRule extends BasePropertyRule {
  type: "FormattedI8nText"
  yamlFormatted: string
  yamlPartialOthers?: true
  xmlWithDefaultLanguage?: true
}
