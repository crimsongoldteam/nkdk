import { z } from "zod/v4"
import { ZBoolEnterprise } from "../elements/сlientApplicationForm/types"

export const ZUseXML = z.object({
  Common: z.boolean(),
  Value: z.array(
    z.object({
      _name: z.string(),
      value: z.boolean(),
    })
  ),
})

export const ZUse = z.object({
  common: z.boolean(),
  values: z.array(
    z.object({
      name: z.string(),
      value: z.boolean(),
    })
  ),
})

export const ZUseEnterprise = z.object({
  РазрешитьИспользование: z.record(z.string(), ZBoolEnterprise).optional(),
  ЗапретитьИспользование: z.record(z.string(), ZBoolEnterprise).optional(),
})

export type TUseXML = z.infer<typeof ZUseXML>
export type TUse = z.infer<typeof ZUse>
export type TUseEnterprise = z.infer<typeof ZUseEnterprise>
