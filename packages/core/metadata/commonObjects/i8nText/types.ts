export interface I8nText {
  items: Record<string, string>
}

export type I8nTextYAML = string | Record<string, string>

export interface I8nTextLanguageXML {
  "v8:lang": string
  "v8:content": string
}

export interface I8nTextXML {
  "v8:item"?: I8nTextLanguageXML[] | I8nTextLanguageXML
}
