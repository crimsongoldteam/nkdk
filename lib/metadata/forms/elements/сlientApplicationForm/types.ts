import * as z from "zod"
import { ZI8nText } from "~/lib/metadata/types"
import { ZI8nTextXML } from "~/lib/xml/types"
import { ZInputField, ZInputFieldXML } from "../inputField/types"

export const ZAutoCommandBarXML = z.object({
  _name: z.string(),
  _id: z.string(),
})

export const ZTypeXML = z.object({
  "v8:Type": z.string(),
  "v8:StringQualifiers": z
    .object({
      "v8:Length": z.number(),
      "v8:AllowedLength": z.enum(["Variable", "Fixed"]),
    })
    .optional(),
})

export const ZAttributeXML = z.object({
  _name: z.string(),
  _id: z.string(),
  Title: ZI8nTextXML.optional(),
  Type: ZTypeXML.optional(),
  MainAttribute: z.boolean().optional(),
})

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
    AutoCommandBar: ZAutoCommandBarXML.optional(),
    Title: ZI8nTextXML.optional(),
    ChildItems: z.array(ZInputFieldXML),
    // Attributes: z.array(ZAttributeXML),
  }),
})

export const ZAutoCommandBar = z.object({
  name: z.string(),
  id: z.string(),
})

export const ZType = z.object({
  type: z.string(),
  stringQualifiers: z
    .object({
      length: z.number(),
      allowedLength: z.enum(["Variable", "Fixed"]),
    })
    .optional(),
})

export const ZAttribute = z.object({
  name: z.string(),
  id: z.string(),
  title: ZI8nText.optional(),
  type: ZType.optional(),
  mainAttribute: z.boolean().optional(),
})

export const ZClientApplicationForm = z.object({
  autoCommandBar: ZAutoCommandBar.optional(),
  title: ZI8nText.optional(),
  // attributes: z.array(ZAttribute),
  items: z.array(ZInputField),
})

export type TClientApplicationForm = z.infer<typeof ZClientApplicationForm>
export type TClientApplicationFormXML = z.infer<typeof ZClientApplicationFormXML>
