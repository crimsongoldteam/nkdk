import { MetadataItem } from "../properties/types"
import { ToYAML } from "../rules"

export interface EventXML {
  _name: string
  "#text": string
}

export type EventsXML = {
  Event: EventXML[] | EventXML
}

export type Events = Record<string, string>

export type EventsYAML = Record<string, string>

export type EventsRules<T extends MetadataItem> = T extends { events?: infer P }
  ? Record<keyof Required<P>, ToYAML<T> extends { События?: infer Pyaml } ? keyof Required<Pyaml> : never>
  : never
