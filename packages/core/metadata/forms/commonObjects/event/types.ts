import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"
import { ElementXML } from "../../../orchestration"

export interface EventXML {
  _name: string
  "#text": string
}

export type EventsXML = {
  Event: EventXML[] | EventXML
}

export interface EventedXML extends ElementXML {
  Events: EventXML[] | EventXML
}

export type Events = Record<string, string>

export type EventsYAML = Record<string, string>

export type EventsRules = Record<string, string>

export interface EventsWidePropertyRule extends WidePropertyRuleBase {
  type: "Events"
}

export type EventsRuleParams = Omit<EventsWidePropertyRule, "type">

export function eventsRule<const Params extends EventsRuleParams>(
  params: WideExactRuleParams<EventsRuleParams, Params>
): Readonly<{ type: "Events" } & Params> {
  return defineWidePropertyRule("Events", params)
}
