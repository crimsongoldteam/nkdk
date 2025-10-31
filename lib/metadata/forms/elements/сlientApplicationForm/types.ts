import * as z from "zod"
import { ZI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZTypeDescription, ZTypeDescriptionXML } from "~/lib/metadata/commonObjects/typeDescription/types"
import { ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZUse, ZUseEnterprise, ZUseXML } from "~/lib/metadata/commonObjects/use/types"
import { ZElementType } from "../types"
import { ZBoolEnterprise } from "../../../types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"

export const ZAutoCommandBarXML = z.object({
  _name: z.string(),
  _id: z.string(),
})

export const ZConditionalAppearanceXML = z.object({
  ConditionalAppearance: z.object(),
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

export const ZAttributesXML = z.array(z.union([ZAttributeXML, ZConditionalAppearanceXML]))

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
    ChildItems: ZChildItemsXML,
    Attributes: ZAttributesXML.optional(),
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
  type: ZTypeDescription.optional(),
  mainAttribute: z.boolean().optional(),
  storedData: z.boolean().optional(),
  use: ZUse.optional(),
})

export const ZClientApplicationForm = z.object({
  elementType: ZElementType,
  autoCommandBar: ZAutoCommandBar.optional(),
  title: ZI8nText.optional(),
  attributes: z.array(ZAttribute).optional(),
  items: ZChildItems,
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

// export const ZAttributesEnterpriseXML = z.record(z.string(), ZAttributeEnterprise)

export type TClientApplicationForm = z.infer<typeof ZClientApplicationForm>
export type TClientApplicationFormXML = z.infer<typeof ZClientApplicationFormXML>
export type TAttributeXML = z.infer<typeof ZAttributeXML>
export type TAttribute = z.infer<typeof ZAttribute>
export type TAttributesXML = z.infer<typeof ZAttributesXML>

export type TAttributeEnterprise = z.infer<typeof ZAttributeEnterprise>
// export type TAttributesEnterpriseXML = z.infer<typeof ZAttributesEnterpriseXML>
