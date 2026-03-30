import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { GroupItemAutoRules } from "./rules"

export type GroupItemAuto = FormTypeByRule<typeof GroupItemAutoRules>

export type GroupItemAutoYAML = "[Авто]" | "([Авто])"

export const GroupItemAutoYAMLValue = {
  enabled: "[Авто]",
  disabled: "([Авто])",
} as const satisfies Record<"enabled" | "disabled", GroupItemAutoYAML>
