import z from "zod"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

const ZChildItem = z.union([ZFormGroup, ZBaseElement])

export type TChildItem = z.infer<typeof ZChildItem>

export const ZChildItems = z.array(ZChildItem)

export const ZChildItemXML = z.object({}).catchall(z.union([ZFormGroupXML, ZBaseElementXML]))
export const ZChildItemsXML = z.array(ZChildItemXML)

export type TChildItems = z.infer<typeof ZChildItems>

export type TChildItemXML = z.infer<typeof ZChildItemXML>
export type TChildItemsXML = z.infer<typeof ZChildItemsXML>
