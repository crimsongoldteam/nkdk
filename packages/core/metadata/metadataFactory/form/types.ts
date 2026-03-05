import { EventsRules, MetadataItemRule } from "~/metadata/orchestration"

export interface ClientApplicationFormRule extends MetadataItemRule {
  events?: EventsRules
}
