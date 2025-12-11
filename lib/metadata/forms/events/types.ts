export interface EventXML {
  _name: string
  "#text"?: string
}

export interface EventsXMLItem {
  Event: EventXML
}

export type EventsXML = EventsXMLItem[]

export type Events = Record<string, string>
