import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZButtonGroup = ZFormGroup.extend({
  representation: SE.ZButtonGroupRepresentation.optional(),
})

export const ZButtonGroupXML = ZFormGroupXML.extend({
  Representation: SE.ZButtonGroupRepresentation.optional(),
})

export type TButtonGroup = z.infer<typeof ZButtonGroup>

export type TButtonGroupXML = z.infer<typeof ZButtonGroupXML>