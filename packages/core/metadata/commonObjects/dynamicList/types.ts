export type DynamicList = {
  Settings: {
    "@attributes": {
      "xsi:type": string
    }
    ManualQuery?: boolean
    DynamicDataRead?: boolean
    Parameter?: Array<Record<string, unknown>>
    MainTable?: string
    ListSettings?: Record<string, unknown>
    [key: string]: unknown
  }
}

export type DynamicListXML = {
  "@attributes"?: {
    "xsi:type"?: string
  }
  ManualQuery?: boolean
  DynamicDataRead?: boolean
  Parameter?: Array<Record<string, unknown>> | Record<string, unknown>
  MainTable?: string
  ListSettings?: Record<string, unknown>
  [key: string]: unknown
}

export type DynamicListEnterprise = {
  "@attributes": {
    "xsi:type": string
  }
  ManualQuery?: boolean
  DynamicDataRead?: boolean
  Parameter?: Array<Record<string, unknown>>
  MainTable?: string
  ListSettings?: Record<string, unknown>
  [key: string]: unknown
}
