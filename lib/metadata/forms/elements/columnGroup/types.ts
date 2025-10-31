import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZColumnGroup = ZFormGroup.extend({
  headerHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  group: SE.ZColumnsGroup.optional(),
  headerPicture: ZPicture.optional(),
  showInHeader: z.boolean().optional(),
  showTitle: z.boolean().optional(),
  headerDataPath: z.string().optional(),
  fixingInTable: SE.ZFixingInTable.optional(),
  headerFormat: z.string().optional(),
  titleBackColor: ZColor.optional(),
})

export const ZColumnGroupXML = ZFormGroupXML.extend({
  HeaderHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  Group: SE.ZColumnsGroup.optional(),
  HeaderPicture: ZPictureXML.optional(),
  ShowInHeader: z.boolean().optional(),
  ShowTitle: z.boolean().optional(),
  HeaderDataPath: z.string().optional(),
  FixingInTable: SE.ZFixingInTable.optional(),
  HeaderFormat: z.string().optional(),
  TitleBackColor: ZColorXML.optional(),
})

export type TColumnGroup = z.infer<typeof ZColumnGroup>

export type TColumnGroupXML = z.infer<typeof ZColumnGroupXML>