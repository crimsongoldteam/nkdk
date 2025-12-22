import { tags } from "typia"

export interface InternalInfoParam {
  name: string
  category: string
}

export interface InternalInfoXML {
  _name: string
  _category: string
  "xr:TypeId": string & tags.Format<"uuid">
  "xr:ValueId": string & tags.Format<"uuid">
}

export type InternalInfoItemsXML = { "xr:GeneratedType": InternalInfoXML[] }

export type InternalInfoParams = InternalInfoParam[]
