import { registerTypeRule } from "../../../../../orchestration/property/typeRuleRegistry"
import { MetadataTypeByRule } from "../../../../../orchestration/metadataItem/element"
import { importGroupItemAutoFromXML } from "./fromXML"
import { importGroupItemAutoFromYAML } from "./fromYAML"
import { GroupItemAutoRules } from "./rules"
import { exportGroupItemAutoToYAML } from "./toYAML"

export type GroupItemAuto = MetadataTypeByRule<typeof GroupItemAutoRules>

export type GroupItemAutoYAML = "[Авто]" | "([Авто])"

registerTypeRule("GroupItemAuto", "importFromYAML", importGroupItemAutoFromYAML)
registerTypeRule("GroupItemAuto", "exportToYAML", exportGroupItemAutoToYAML)
registerTypeRule("GroupItemAuto", "importFromXML", importGroupItemAutoFromXML as any)
