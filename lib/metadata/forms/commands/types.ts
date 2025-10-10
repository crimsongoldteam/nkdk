import { z } from "zod"
import { ZI8nTextXML, ZI8nText } from "../../i8nText/types"
import { ZPicture, ZPictureXML } from "../picture/types"
import { ZButtonRepresentation, ZCurrentRowUse } from "../../systemEnumerations/systemEnumerations"

const ZCommandXML = z.object({
  _name: z.string(),
  _id: z.string(),
  Title: ZI8nTextXML,
  ToolTip: ZI8nTextXML,
  Shortcut: z.string(),
  Picture: ZPictureXML,
  Action: z.string(),
  Representation: ZButtonRepresentation,
  CurrentRowUse: ZCurrentRowUse,
})

export const ZCommand = z.object({
  name: z.string(),
  id: z.string(),
  title: ZI8nText,
  toolTip: ZI8nText,
  shortcut: z.string(),
  picture: ZPicture,
  action: z.string(),
  representation: ZButtonRepresentation,
  currentRowUse: ZCurrentRowUse,
})

export type TCommandXML = z.infer<typeof ZCommandXML>
export type TCommand = z.infer<typeof ZCommand>
