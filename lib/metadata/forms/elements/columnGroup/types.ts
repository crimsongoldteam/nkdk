import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZColumnGroup = ZFormGroup.extend({
  fixingInTable: SE.ZFixingInTable.optional(),
  group: SE.ZColumnsGroup.optional(),
  headerDataPath: z.string().optional(),
  headerFormat: z.string().optional(),
  headerHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  headerPicture: ZPicture.optional(),
  showInHeader: z.boolean().optional(),
  showTitle: z.boolean().optional(),
  titleBackColor: ZColor.optional(),
})

export const ZColumnGroupXML = ZFormGroupXML.extend({
  Group: SE.ZColumnsGroup.optional(),
  TitleBackColor: ZColorXML.optional(),
  ShowInHeader: z.boolean().optional(),
  HeaderDataPath: z.string().optional(),
  HeaderHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  HeaderPicture: ZPictureXML.optional(),
  HeaderFormat: z.string().optional(),
  FixingInTable: SE.ZFixingInTable.optional(),
  ShowTitle: z.boolean().optional(),
})

export type TColumnGroup = z.infer<typeof ZColumnGroup>

export type TColumnGroupXML = z.infer<typeof ZColumnGroupXML>