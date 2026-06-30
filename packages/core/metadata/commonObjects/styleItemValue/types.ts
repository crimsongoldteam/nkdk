import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Border, BorderXML, BorderYAML } from "~/metadata/commonObjects/border/types"
import { Color, ColorXML, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontXML, FontYAML } from "~/metadata/commonObjects/font/types"

export type StyleItemValue =
  | { type: "Font"; value: Font }
  | { type: "Color"; value: Color }
  | { type: "Border"; value: Border }

export type StyleItemValueXML =
  | (FontXML & { "_xsi:type": "v8ui:Font" })
  | { "_xsi:type": "v8ui:Color"; "#text"?: ColorXML }
  | (BorderXML & { "_xsi:type": "v8ui:Border" })

export type StyleItemValueYAML =
  | { Вид: "Шрифт"; Значение: FontYAML }
  | { Вид: "Цвет"; Значение: ColorYAML }
  | { Вид: "Рамка"; Значение: BorderYAML }

export interface StyleItemValueWidePropertyRule extends WidePropertyRuleBase {
  type: "StyleItemValue"
}

export type StyleItemValueRuleParams = Omit<StyleItemValueWidePropertyRule, "type">

export function styleItemValueRule<const Params extends StyleItemValueRuleParams>(
  params: WideExactRuleParams<StyleItemValueRuleParams, Params>
): Readonly<{ type: "StyleItemValue" } & Params> {
  return defineWidePropertyRule("StyleItemValue", params)
}
