import { Type, type Static } from "typebox"

export const configurationComponentPathSchema = Type.String({
  pattern: "^(?:cf|cfe/[^/\\\\.][^/\\\\]*)$",
})

export type ConfigurationComponentPath = Static<typeof configurationComponentPathSchema>
