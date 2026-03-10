import { ElementXML } from "~/metadata/orchestration"

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
