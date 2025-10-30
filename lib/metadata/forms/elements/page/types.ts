import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZPicture, ZPictureXML } from "../../pictures/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZPage = ZFormGroup.extend({
  displayImportance: SE.ZDisplayImportance.optional(),
  verticalScrollOnReduceSize: z.boolean().optional(),
  verticalAlign: SE.ZItemVerticalAlign.optional(),
  childItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  verticalSpacing: SE.ZFormItemSpacing.optional(),
  itemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  childItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  horizontalSpacing: SE.ZFormItemSpacing.optional(),
  group: SE.ZChildFormItemsGroup.optional(),
  picture: ZPicture.optional(),
  showTitle: z.boolean().optional(),
  titleDataPath: z.string().optional(),
  format: z.string().optional(),
  backColor: ZColor.optional(),
  slaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
})

export const ZPageXML = ZFormGroupXML.extend({
  DisplayImportance: SE.ZDisplayImportance.optional(),
  VerticalScrollOnReduceSize: z.boolean().optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  ChildItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalSpacing: SE.ZFormItemSpacing.optional(),
  ItemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  ChildItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  HorizontalSpacing: SE.ZFormItemSpacing.optional(),
  Group: SE.ZChildFormItemsGroup.optional(),
  Picture: ZPictureXML.optional(),
  ShowTitle: z.boolean().optional(),
  TitleDataPath: z.string().optional(),
  Format: z.string().optional(),
  BackColor: ZColorXML.optional(),
  SlaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
})

export type TPage = z.infer<typeof ZPage>

export type TPageXML = z.infer<typeof ZPageXML>