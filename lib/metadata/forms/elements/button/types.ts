import * as z from "zod"
import { ZNamedElement } from "../element/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/i8nText/types"
import { ZPicture, ZPictureXML } from "../../pictures/types"
import { ZButtonRepresentation, ZCurrentRowUse } from "~/lib/metadata/systemEnumerations/types"
import { ZUse, ZUseXML } from "../../use/types"

export const ZButtonXML = z.object({
  Button: z.object({
    _id: z.string(),
    _name: z.string(),
    Title: ZI8nTextXML.optional(),
    ToolTip: ZI8nTextXML.optional(),
    Use: ZUseXML.optional(),
    Shortcut: z.string().optional(),
    Picture: ZPictureXML.optional(),
    Action: z.string().optional(),
    Representation: ZButtonRepresentation.optional(),
    ModifiesSavedData: z.boolean().optional(),
    CurrentRowUse: ZCurrentRowUse.optional(),
  }),
})

export const ZButton = ZNamedElement.extend({
  title: ZI8nText.optional(),
  toolTip: ZI8nText.optional(),
  use: ZUse.optional(),
  shortcut: z.string().optional(),
  picture: ZPicture.optional(),
  action: z.string().optional(),
  representation: ZButtonRepresentation.optional(),
  currentRowUse: ZCurrentRowUse.optional(),
  modifiesSavedData: z.boolean().optional(),
})

export type TButton = z.infer<typeof ZButton>
export type TButtonXML = z.infer<typeof ZButtonXML>
