import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZPage = ZFormGroup.extend({
  backColor: ZColor.optional(),
  childItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  childItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  format: ZI8nText.optional(),
  group: SE.ZChildFormItemsGroup.optional(),
  horizontalSpacing: SE.ZFormItemSpacing.optional(),
  itemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  picture: ZPicture.optional(),
  showTitle: z.boolean().optional(),
  slaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
  titleDataPath: z.string().optional(),
  verticalAlign: SE.ZItemVerticalAlign.optional(),
  verticalScrollOnReduceSize: z.boolean().optional(),
  verticalSpacing: SE.ZFormItemSpacing.optional(),
})

export const ZPageXML = ZFormGroupXML.extend({
  Picture: ZPictureXML.optional(),
  Group: SE.ZChildFormItemsGroup.optional(),
  HorizontalSpacing: SE.ZFormItemSpacing.optional(),
  VerticalSpacing: SE.ZFormItemSpacing.optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  Format: ZI8nTextXML.optional(),
  TitleDataPath: z.string().optional(),
  BackColor: ZColorXML.optional(),
  ChildItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  ChildItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  DisplayImportance: SE.ZDisplayImportance.optional(),
  ItemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  ShowTitle: z.boolean().optional(),
  SlaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
  VerticalScrollOnReduceSize: z.boolean().optional(),
})

export type TPage = z.infer<typeof ZPage>

export type TPageXML = z.infer<typeof ZPageXML>