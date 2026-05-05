import { Static, Type } from "@sinclair/typebox"

export const NumberJSONSchema = Type.Number()

export type NumberYAML = Static<typeof NumberJSONSchema>
