import { BasePropertyRule } from "~/metadata/orchestration"

export const uuidPropertyRule = {
  type: "uuid",
  xml: "_uuid",
  forReferenceOnly: true,
  toYAML: false,
  fromYAML: false,
} as const satisfies BasePropertyRule
