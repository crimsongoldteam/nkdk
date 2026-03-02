import { Static, Type } from "@sinclair/typebox"

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
  "v8:item"?: I8nTextLanguageXML[] | I8nTextLanguageXML
}
