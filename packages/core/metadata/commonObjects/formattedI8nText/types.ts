import { StringboolXML } from "../boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "../i8nText/types"

export interface FormattedI8nText extends I8nText {
  formatted: boolean
  items: Record<string, string>
}

export type FormattedI8nTextEnterprise = I8nTextEnterprise

export interface FormattedI8nTextXML extends I8nTextXML {
  _formatted?: StringboolXML
}
