import { Static, Type } from "@sinclair/typebox"

export type StringboolXML = "true" | "false" | boolean

export const BooleanJSONSchema = Type.Union([Type.Literal("Истина"), Type.Literal("Ложь")])

export type StringboolYAML = Static<typeof BooleanJSONSchema>
