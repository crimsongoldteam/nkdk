import * as z from "zod/v4"
import { ZI8nText } from "~/lib/metadata/i8nText/types"
import { ZTypeDescription, ZTypeDescriptionXML } from "~/lib/metadata/typeDescription/types"
import { ZI8nTextXML } from "~/lib/metadata/i8nText/types"
import { ZInputField, ZInputFieldXML } from "../inputField/types"
import { ZUse, ZUseEnterprise, ZUseXML } from "~/lib/metadata/forms/use/types"
import { ZElement } from "../element/types"

export const ZBoolEnterprise = z.enum(["Истина", "Ложь"])

export const ZAutoCommandBarXML = z.object({
  _name: z.string(),
  _id: z.string(),
})

export const ZAttributeXML = z.object({
  Attribute: z.object({
    _name: z.string(),
    _id: z.string(),
    Title: ZI8nTextXML.optional(),
    Type: ZTypeDescriptionXML,
    MainAttribute: z.boolean().optional(),
    StoredData: z.boolean().optional(),
    Use: ZUseXML.optional(),
  }),
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
    Attributes: z.array(ZAttributeXML).optional(),
  }),
})

export const ZAutoCommandBar = z.object({
  name: z.string(),
  id: z.string(),
})

export const ZAttribute = z.object({
  name: z.string(),
  id: z.string(),
  title: ZI8nText.optional(),
  type: ZTypeDescription,
  mainAttribute: z.boolean().optional(),
  storedData: z.boolean().optional(),
  use: ZUse.optional(),
})

export const ZClientApplicationForm = ZElement.extend({
  autoCommandBar: ZAutoCommandBar.optional(),
  title: ZI8nText.optional(),
  attributes: z.array(ZAttribute).optional(),
  items: z.array(ZInputField),
})

export const ZAttributeEnterprise = z.union([
  z.object({
    Заголовок: z.string().optional(),
    Тип: z.string().optional(),
    ОсновнойАтрибут: ZBoolEnterprise.optional(),
    СохраняемыеДанные: ZBoolEnterprise.optional(),
  }),
  ZUseEnterprise,
])

export const ZAttributesEnterpriseXML = z.record(z.string(), ZAttributeEnterprise)

export type TClientApplicationForm = z.infer<typeof ZClientApplicationForm>
export type TClientApplicationFormXML = z.infer<typeof ZClientApplicationFormXML>
export type TAttributeXML = z.infer<typeof ZAttributeXML>
export type TAttribute = z.infer<typeof ZAttribute>

export type TAttributeEnterprise = z.infer<typeof ZAttributeEnterprise>
export type TAttributesEnterpriseXML = z.infer<typeof ZAttributesEnterpriseXML>
