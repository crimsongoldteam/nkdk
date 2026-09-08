import { uuidRule } from "./types"

export const uuidPropertyRule = uuidRule({
  xml: "_uuid",
  xmlOnly: true,
  toYAML: false,
  fromYAML: false,
})
