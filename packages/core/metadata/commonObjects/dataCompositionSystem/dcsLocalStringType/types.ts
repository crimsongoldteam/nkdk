import type { I8nText } from "~/metadata/commonObjects/i8nText/types"

export type DcsLocalStringTypeXML =
  | string
  | {
      "_xsi:type"?: string
      "#text"?: unknown
      "v8:item"?: unknown
    }
  | undefined

export type DcsLocalStringTypeReference = I8nText | string
