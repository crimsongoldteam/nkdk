import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZPages = ZFormGroup.extend({
  currentRowUse: SE.ZCurrentRowUse.optional(),
  associatedTable: ZFormTable.optional(),
  pagesRepresentation: SE.ZFormPagesRepresentation.optional(),
  currentPage: ZFormGroup.optional(),
  currentPagesState: SE.ZFormPagesState.optional(),
})

export const ZPagesXML = ZFormGroupXML.extend({
  CurrentRowUse: SE.ZCurrentRowUse.optional(),
  AssociatedTable: ZFormTableXML.optional(),
  PagesRepresentation: SE.ZFormPagesRepresentation.optional(),
  CurrentPage: ZFormGroupXML.optional(),
  CurrentPagesState: SE.ZFormPagesState.optional(),
})

export type TPages = z.infer<typeof ZPages>

export type TPagesXML = z.infer<typeof ZPagesXML>