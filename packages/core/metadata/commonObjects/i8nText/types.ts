import { StringboolXML } from "../boolean/types"

export interface I8nText {
  formatted?: boolean
  items: Record<string, string>
}

export type I8nTextEnterprise = string | Record<string, string>

export interface I8nTextLanguageXML {
  "v8:lang": string
  "v8:content": string
}

export interface I8nTextItemXML {
  _formatted?: StringboolXML
  "v8:item"?: I8nTextLanguageXML[] | I8nTextLanguageXML
}
export type I8nTextXML = I8nTextItemXML
