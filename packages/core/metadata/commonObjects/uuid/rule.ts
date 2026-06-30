import { uuidRule } from "./types"

export const uuidPropertyRule = uuidRule({
  xml: "_uuid",
  forReferenceOnly: true,
  toYAML: false,
  fromYAML: false,
})
