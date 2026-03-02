import { Static, Type } from "@sinclair/typebox"

export const StringJSONSchema = Type.String()

export type StringYAML = Static<typeof StringJSONSchema>
