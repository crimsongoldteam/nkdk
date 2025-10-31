import z from "zod"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"

export const ZChildItems = z.array(ZBaseElement)

export const ZChildItemXML = z.record(z.string(), ZBaseElementXML)
export const ZChildItemsXML = z.array(ZChildItemXML)

export type TChildItems = z.infer<typeof ZChildItems>

export type TChildItemXML = z.infer<typeof ZChildItemXML>
export type TChildItemsXML = z.infer<typeof ZChildItemsXML>
