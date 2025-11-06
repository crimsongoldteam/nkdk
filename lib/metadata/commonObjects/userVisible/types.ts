import { z } from "zod"
import { ZBoolEnterprise } from "../../types"

export const ZUserVisibleXML = z.object({
  Common: z.boolean(),
  Value: z.array(
    z.object({
      _name: z.string(),
      value: z.boolean(),
    })
  ),
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
