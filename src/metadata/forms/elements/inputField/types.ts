import * as z from "zod"
import { ZI8nText, ZI8nTextXML } from "@/types"

export const ZInputFieldXML = z.object({
  _name: z.string(),
  Title: ZI8nTextXML,
})

export const ZInputField = z.object({
  name: z.string().optional(),
  title: ZI8nText.optional(),
})
