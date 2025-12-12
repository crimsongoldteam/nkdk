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
  table?: string,
  userVisible?: UserVisible,
}

export interface ObjectXML {
  _name: z.string(),
  _id: z.string(),
  AdditionalFields: ChoiceParameterLinks,
  IndexedFields: ChoiceParameterLinks,
  Table: string,
  UserVisible: UserVisible,
}