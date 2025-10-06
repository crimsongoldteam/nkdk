import * as z from "zod"
import { ZI8nText } from "~/lib/metadata/types"
import { ZI8nTextXML } from "~/lib/xml/types"
import { ZInputField, ZInputFieldXML } from "../inputField/types"

export const ZClientApplicationFormXML = z.object({
  Form: z.object({
    _xmlns: z.string().optional(),
    "_xmlns:app": z.string().optional(),
    "_xmlns:cfg": z.string().optional(),
    "_xmlns:dcscor": z.string().optional(),
    "_xmlns:dcssch": z.string().optional(),
    "_xmlns:dcsset": z.string().optional(),
    "_xmlns:ent": z.string().optional(),
    "_xmlns:lf": z.string().optional(),
    "_xmlns:style": z.string().optional(),
    "_xmlns:sys": z.string().optional(),
    "_xmlns:v8": z.string().optional(),
    "_xmlns:v8ui": z.string().optional(),
    "_xmlns:web": z.string().optional(),
    "_xmlns:win": z.string().optional(),
    "_xmlns:xr": z.string().optional(),
    "_xmlns:xs": z.string().optional(),
    "_xmlns:xsi": z.string().optional(),
    _version: z.string().optional(),
    Title: ZI8nTextXML.optional(),
    ChildItems: z.array(ZInputFieldXML),
  }),
})

export const ZClientApplicationForm = z.object({
  title: ZI8nText.optional(),

  items: z.array(ZInputField),
})

export type TClientApplicationForm = z.infer<typeof ZClientApplicationForm>
export type TClientApplicationFormXML = z.infer<typeof ZClientApplicationFormXML>
