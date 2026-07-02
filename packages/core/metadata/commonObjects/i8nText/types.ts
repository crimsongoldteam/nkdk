import { Type } from "@sinclair/typebox"
import type { Static } from "@sinclair/typebox"
import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import { ConfigurationContext } from "~/metadata/context/types"
import { TypeRulesOperations } from "~/metadata/orchestration"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export interface I8nText {
  items: Record<string, string>
}

export const I8nTextJSONSchema = Type.Union([Type.String(), Type.Record(Type.String(), Type.String())])

export type I8nTextYAML = Static<typeof I8nTextJSONSchema>

export interface I8nTextLanguageXML {
  "v8:lang": string
  "v8:content": string
}

export interface I8nTextXML {
  /** При типизированной выгрузке (`typedXML` в rule) — `xsi:type="v8:LocalStringType"` */
  "_xsi:type"?: "v8:LocalStringType"
  "v8:item"?: I8nTextLanguageXML[] | I8nTextLanguageXML
}

type I8nTextDefaultValueFunction = (params: {
  context: ConfigurationContext
  name?: string
  operation: TypeRulesOperations
}) => I8nText

export interface I8nTextPropertyRule extends Omit<BasePropertyRule, "defaultValue"> {
  type: "I8nText"
  skipEmptyToXML?: true
  /** Выгружать полностью пустой I8nText как пустой XML-тег. */
  emptyAsRawXML?: true

  /**
   * Если значение поля приведенное к pascalCase равно имени элемента - поле не будет выгружено в yaml
   */
  excludeIfEqualNameYAML?: true
  defaultValue?: I8nText | I8nTextDefaultValueFunction
  /** Выгружать I8nText с указанием типа: `xsi:type="v8:LocalStringType"` */
  typedXML?: true
}

export type I8nTextRuleParams = Omit<I8nTextPropertyRule, "type">

export function i8nTextRule<const Params extends I8nTextRuleParams>(
  params: ExactRuleParams<I8nTextRuleParams, Params>
): Readonly<{ type: "I8nText" } & Params> {
  return definePropertyRule("I8nText", params)
}
