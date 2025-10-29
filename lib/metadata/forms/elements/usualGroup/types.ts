import * as z from "zod"
import { ZI8nText } from "~/lib/metadata/i8nText/types"
import { ZI8nTextXML } from "~/lib/metadata/i8nText/types"
import { ZNamedElement } from "../baseElement/types"
import {
  ZChildFormItemsGroup,
  ZUsualGroupBehavior,
  ZUsualGroupRepresentation,
} from "~/lib/metadata/systemEnumerations/types"

export const ZUsualGroupXML = z.object({
  UsualGroup: z.object({
    _name: z.string(),
    _id: z.string(),
    Title: ZI8nTextXML.optional(),
    Visible: z.boolean().optional(),
    Group: ZChildFormItemsGroup.optional(),
    ChildItems: z.any().optional(),
  }),
})

export const ZUsualGroup = ZNamedElement.extend({
  title: ZI8nText.optional(),
  visible: z.boolean().optional(),
  group: ZChildFormItemsGroup.optional(),
  representation: ZUsualGroupRepresentation.optional(),
  behavior: ZUsualGroupBehavior.optional(),
  childItems: z.array(ZNamedElement),
})

export type TUsualGroup = z.infer<typeof ZUsualGroup>
export type TUsualGroupXML = z.infer<typeof ZUsualGroupXML>
