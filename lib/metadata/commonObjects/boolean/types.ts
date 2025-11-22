import z from "zod"

export const ZBoolEnterprise = z.enum(["Истина", "Ложь"])
export type TBoolEnterprise = z.infer<typeof ZBoolEnterprise>
