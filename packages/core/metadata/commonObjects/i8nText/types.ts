import { StringboolXML } from "../boolean/types"

export interface I8nText {
  items: Record<string, string>
}

export interface FormattedI8nText {
  formatted?: boolean
  items: Record<string, string>
}

export type I8nTextEnterprise = string | Record<string, string>

export interface I8nTextLanguageXML {
  "v8:lang": string
  "v8:content": string
}

export interface I8nTextXML {
  "v8:item"?: I8nTextLanguageXML[] | I8nTextLanguageXML
}

export interface FormattedI8nTextXML extends I8nTextXML {
  _formatted?: StringboolXML
  "v8:item"?: I8nTextLanguageXML[] | I8nTextLanguageXML
}
