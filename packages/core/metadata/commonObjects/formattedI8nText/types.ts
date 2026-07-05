import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"
import type { BasePropertyRule } from "../../orchestration/property/types"
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
  /** Если значение поля приведенное к pascalCase равно имени элемента - поле не будет выгружено в yaml */
  excludeIfEqualNameYAML?: true
}

export interface FormattedI8nTextWidePropertyRule extends WidePropertyRuleBase {
  type: "FormattedI8nText"
}

export type FormattedI8nTextRuleParams = Omit<FormattedI8nTextWidePropertyRule, "type">

export function formattedI8nTextRule<const Params extends FormattedI8nTextRuleParams>(
  params: WideExactRuleParams<FormattedI8nTextRuleParams, Params>
): Readonly<{ type: "FormattedI8nText" } & Params> {
  return defineWidePropertyRule("FormattedI8nText", params)
}
