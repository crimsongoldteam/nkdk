import { z } from "zod"
import { ZI8nTextXML, ZI8nText, ZI8nTextEnterprise } from "../../i8nText/types"
import { ZPicture, ZPictureEnterprise, ZPictureXML } from "../pictures/types"
import {
  ZButtonRepresentation,
  ZCurrentRowUse,
  ZCurrentRowUseEnterprise,
} from "../../systemEnumerations/systemEnumerations"
import { ZUseEnterprise, ZUseXML } from "../use/types"
import { ZUse } from "../use/types"

const ZCommandXML = z.object({
  _name: z.string(),
  _id: z.string(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  Use: ZUseXML.optional(),
  Shortcut: z.string().optional(),
  Picture: ZPictureXML.optional(),
  Action: z.string().optional(),
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
  shortcut: z.string().optional(),
  picture: ZPicture.optional(),
  action: z.string().optional(),
  representation: ZButtonRepresentation.optional(),
  currentRowUse: ZCurrentRowUse.optional(),
  modifiesSavedData: z.boolean().optional(),
})

export const ZCommandEnterprise = z.record(
  z.string(),
  z.union([
    z.object({
      Заголовок: ZI8nTextEnterprise.optional(),
      Подсказка: ZI8nTextEnterprise.optional(),
      СочетаниеКлавиш: z.string().optional(),
      Картинка: ZPictureEnterprise.optional(),
      Действие: z.string().optional(),
      ОтображениеКнопки: ZButtonRepresentation.optional(),
      ИспользованиеТекущейСтроки: ZCurrentRowUseEnterprise.optional(),
      ИзменяемыеДанные: z.boolean().optional(),
    }),
    ZUseEnterprise,
  ])
)

export type TCommandXML = z.infer<typeof ZCommandXML>
export type TCommandEnterprise = z.infer<typeof ZCommandEnterprise>
export type TCommand = z.infer<typeof ZCommand>
