import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"

export interface ExtendedTooltip extends FormDecoration {}

export interface ExtendedTooltipXML extends FormDecorationXML {}

export interface ExtendedTooltipEnterprise extends FormDecorationEnterprise {
  Имя: string
}
