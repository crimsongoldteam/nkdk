import { Static, Type } from "@sinclair/typebox"

export interface InternalInfoParam {
  name: string
  category: string
}

export interface InternalInfoXML {
  _name: string
  _category: string
  "xr:TypeId": string
  "xr:ValueId": string
}

export type InternalInfoItemsXML<T extends InternalInfoParam[]> = {
  "xr:GeneratedType": {
    _name: T[number]["name"]
    _category: T[number]["category"]
    "xr:TypeId": string
    "xr:ValueId": string
  }[]
}

export type InternalInfoParams = InternalInfoParam[]

export const InternalInfoParamJSONSchema = Type.Object({
  name: Type.String(),
  category: Type.String(),
})
export type InternalInfoParamFromSchema = Static<typeof InternalInfoParamJSONSchema>
