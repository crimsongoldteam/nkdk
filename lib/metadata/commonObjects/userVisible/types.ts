import { z } from "zod"
import { TBoolEnterprise, ZBoolEnterprise } from "../boolean/types"

export interface UserVisibleItemXML {
  _name: string
  "#text": boolean
}

export interface UserVisibleXMLItem {
  "xr:Common"?: boolean
  "xr:Value"?: UserVisibleItemXML
}

export type UserVisibleXML = UserVisibleXMLItem[]

export interface UserVisibleValue {
  name: string
  value: boolean
}

export interface UserVisible {
  common: boolean
  values: UserVisibleValue[]
}

export interface UserVisibleEnterprise {
  РазрешитьИспользование?: Record<string, TBoolEnterprise>
  ЗапретитьИспользование?: Record<string, TBoolEnterprise>
}

// Zod схемы для обратной совместимости с другими модулями
const ZUserVisibleItemXML = z.object({
  _name: z.string(),
  "#text": z.boolean(),
})

export const ZUserVisibleXML = z.array(
  z.object({
    "xr:Common": z.boolean().optional(),
    "xr:Value": ZUserVisibleItemXML.optional(),
  })
)

export const ZUserVisible = z.object({
  common: z.boolean(),
  values: z.array(
    z.object({
      name: z.string(),
      value: z.boolean(),
    })
  ),
})

export const ZUserVisibleEnterprise = z.object({
  РазрешитьИспользование: z.record(z.string(), ZBoolEnterprise).optional(),
  ЗапретитьИспользование: z.record(z.string(), ZBoolEnterprise).optional(),
})
