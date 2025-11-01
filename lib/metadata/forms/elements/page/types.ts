import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZPage = ZFormGroup.extend({
  backColor: ZColor.optional(),
  childItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  childItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  format: z.string().optional(),
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
  BackColor: ZColorXML.optional(),
  ChildItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  ChildItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  DisplayImportance: SE.ZDisplayImportance.optional(),
  Format: z.string().optional(),
  Group: SE.ZChildFormItemsGroup.optional(),
  HorizontalSpacing: SE.ZFormItemSpacing.optional(),
  ItemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  Picture: ZPictureXML.optional(),
  ShowTitle: z.boolean().optional(),
  SlaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
  TitleDataPath: z.string().optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalScrollOnReduceSize: z.boolean().optional(),
  VerticalSpacing: SE.ZFormItemSpacing.optional(),
})

export type TPage = z.infer<typeof ZPage>

export type TPageXML = z.infer<typeof ZPageXML>