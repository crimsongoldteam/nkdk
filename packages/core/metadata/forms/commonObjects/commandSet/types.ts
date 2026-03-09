import { Static, Type } from "@sinclair/typebox"

export interface CommandSetXML {
  ExcludedCommand: string | string[]
}

export type CommandSet = string[]

export const CommandSetJSONSchema = Type.Array(Type.String())

export type CommandSetYAML = Static<typeof CommandSetJSONSchema>
