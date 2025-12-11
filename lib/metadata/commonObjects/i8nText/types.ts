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
  "@attributes"?: { formatted?: boolean }
  "v8:item"?: I8nTextLanguageXML
}
export type I8nTextXML = I8nTextItemXML[]

// Re-export zod schemas and types from schemas.ts
export {
  ZI8nText,
  ZI8nTextXML,
  ZI8nTextEnterprise,
  type TI8nText,
  type TI8nTextXML,
  type TI8nTextEnterprise,
} from "./schemas"
