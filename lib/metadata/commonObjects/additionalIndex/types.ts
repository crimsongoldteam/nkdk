import * as z from "zod"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZTable, ZTableXML } from "../table/types"
import { ZChoiceParameterLinks, ZChoiceParameterLinksXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { ZodChildItemsType } from "../childItems/typesExt"

export interface Object {
  elementType: ElementType
  name: string
  id?: string
  additionalFields?: ChoiceParameterLinks,
  indexedFields?: ChoiceParameterLinks,
  get table() {
    return string
  },
  userVisible?: UserVisible,
}

export const ZObjectXML = z.object({
  _name: z.string(),
  _id: z.string(),
  AdditionalFields: ZChoiceParameterLinksXML.optional(),
  IndexedFields: ZChoiceParameterLinksXML.optional(),
  get Table() {
    return z.string().optional()
  },
  UserVisible: ZUserVisibleXML.optional(),
})

export type TObject = z.infer<typeof ZObject>

export type TObjectXML = z.infer<typeof ZObjectXML>