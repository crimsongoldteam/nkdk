import { z } from "zod"
import { ZI8nTextXML, ZI8nText } from "../../i8nText/types"
import { ZPicture, ZPictureXML } from "../picture/types"
import { ZButtonRepresentation, ZCurrentRowUse } from "../../systemEnumerations/systemEnumerations"
import { ZUseXML } from "../use/types"
import { ZUse } from "../use/types"

const ZCommandXML = z.object({
  _name: z.string(),
  _id: z.string(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  Use: ZUseXML.optional(),
  Shortcut: z.string(),
  Picture: ZPictureXML.optional(),
  Action: z.string(),
  Representation: ZButtonRepresentation.optional(),
  ModifiesSavedData: z.boolean().optional(),
  CurrentRowUse: ZCurrentRowUse.optional(),
})

export const ZCommand = z.object({
  name: z.string(),
  id: z.string(),
  title: ZI8nText.optional(),
  toolTip: ZI8nText.optional(),
  use: ZUse.optional(),
  shortcut: z.string(),
  picture: ZPicture.optional(),
  action: z.string(),
  representation: ZButtonRepresentation.optional(),
  currentRowUse: ZCurrentRowUse.optional(),
  modifiesSavedData: z.boolean().optional(),
})

export type TCommandXML = z.infer<typeof ZCommandXML>
export type TCommand = z.infer<typeof ZCommand>
