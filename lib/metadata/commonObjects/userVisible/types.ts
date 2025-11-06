import { z } from "zod"
import { ZBoolEnterprise } from "../../types"

const ZUserVisibleItemXML = z.object({
  _name: z.string(),
  "#text": z.boolean(),
})

export const ZUserVisibleXML = z.object({
  "xr:Common": z.boolean(),
  "xr:Value": z
    .union([z.array(ZUserVisibleItemXML), ZUserVisibleItemXML])
    .optional(),
})

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

export type TUserVisibleXML = z.infer<typeof ZUserVisibleXML>
export type TUserVisible = z.infer<typeof ZUserVisible>
export type TUserVisibleEnterprise = z.infer<typeof ZUserVisibleEnterprise>
