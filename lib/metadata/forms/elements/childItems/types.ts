import z from "zod"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"

export const ZChildItems = z.array(ZBaseElement)
export const ZChildItemsXML = z.array(ZBaseElementXML)

export type TChildItems = z.infer<typeof ZChildItems>

export type TChildItemsXML = z.infer<typeof ZChildItemsXML>
