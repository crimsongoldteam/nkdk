import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZCommandBar = ZFormGroup.extend({
  displayImportance: SE.ZDisplayImportance.optional(),
  horizontalAlign: SE.ZItemHorizontalLocation.optional(),
})

export const ZCommandBarXML = ZFormGroupXML.extend({
  DisplayImportance: SE.ZDisplayImportance.optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
})

export type TCommandBar = z.infer<typeof ZCommandBar>

export type TCommandBarXML = z.infer<typeof ZCommandBarXML>