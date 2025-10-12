import * as z from "zod"
import { ZI8nText } from "~/lib/metadata/i8nText/types"
import { ZI8nTextXML } from "~/lib/metadata/i8nText/types"
import { ZElement } from "../element/types"
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
    Group: ZChildFormItemsGroup.optional(),
    ChildItems: z.any().optional(),
  }),
})

export const ZUsualGroup = ZElement.extend({
  title: ZI8nText.optional(),
  group: ZChildFormItemsGroup.optional(),
  representation: ZUsualGroupRepresentation.optional(),
  behavior: ZUsualGroupBehavior.optional(),
  childItems: z.array(ZElement),
})

export type TUsualGroup = z.infer<typeof ZUsualGroup>
export type TUsualGroupXML = z.infer<typeof ZUsualGroupXML>
