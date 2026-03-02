import { Static, Type } from "@sinclair/typebox"

export type FunctionalOptions = string[]

export interface FunctionalOptionsXML {
  Item: string | string[]
}

export const FunctionalOptionsPropertyJSONSchema = Type.Array(Type.String())
export type FunctionalOptionsYAML = Static<typeof FunctionalOptionsPropertyJSONSchema>
