import { MetadataItemRule } from ".."
import { EventsRules } from "../events"

export interface ClientApplicationFormRule extends MetadataItemRule {
  events?: EventsRules
}
