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

export type InternalInfoItemsXML<T extends InternalInfoParam[]> = {
  "xr:GeneratedType": {
    _name: T[number]["name"]
    _category: T[number]["category"]
    "xr:TypeId": string & tags.Format<"uuid">
    "xr:ValueId": string & tags.Format<"uuid">
  }[]
}

export type InternalInfoParams = InternalInfoParam[]
