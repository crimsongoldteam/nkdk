export interface EventXML {
  _name: string
  "#text": string
}

export type EventsXML = {
  Event: EventXML[] | EventXML
}

export type Events = Record<string, string>

export type EventsEnterprise = Record<string, string>
