import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import { Type } from "typebox"
import type { Static } from "typebox"
import type { BasePropertyRule } from "@nkdk/runtime/rule-kit"
import { StringboolXML } from "../boolean/types"
import {
  FoldableI8nTextJSONSchema,
  I8nText,
  I8nTextJSONSchema,
  I8nTextXML,
} from "../i8nText/types"

export interface FormattedI8nText extends I8nText {
  formatted: boolean
  items: Record<string, string>
}

const formattedI8nTextJSONSchema = (textSchema: typeof I8nTextJSONSchema) => Type.Union([
  Type.Object(
    {
      Форматированный: Type.Optional(Type.Literal("Истина")),
      Текст: textSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    { Форматированный: Type.Literal("Истина") },
    { additionalProperties: false },
  ),
])

export const FormattedI8nTextJSONSchema = formattedI8nTextJSONSchema(I8nTextJSONSchema)
export const FoldableFormattedI8nTextJSONSchema = formattedI8nTextJSONSchema(FoldableI8nTextJSONSchema)

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
