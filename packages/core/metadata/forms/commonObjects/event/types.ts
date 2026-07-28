import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"
import { ElementXML } from "../../../orchestration"

export const EVENT_CALL_TYPES_XML = ["Before", "After", "Override"] as const
export const EVENT_CALL_TYPES_YAML = ["Перед", "После", "Вместо"] as const

export type EventCallTypeXML = (typeof EVENT_CALL_TYPES_XML)[number]
export type EventCallTypeYAML = (typeof EVENT_CALL_TYPES_YAML)[number]

export interface EventXML {
  _name: string
  _callType?: EventCallTypeXML
  "#text": string
}

export type EventsXML = {
  Event: EventXML[] | EventXML
}

export interface EventedXML extends ElementXML {
  Events: EventsXML
}

export type EventCallHandlers = Partial<Record<EventCallTypeXML, string>>
export type EventCallHandlersYAML = Partial<Record<EventCallTypeYAML, string>>
export type Events = Record<string, string | EventCallHandlers>

export type EventsYAML = Record<string, string | EventCallHandlersYAML>

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
