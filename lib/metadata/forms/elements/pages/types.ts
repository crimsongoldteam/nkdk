import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZTable, ZTableXML } from "../table/types"

export const ZPages = ZFormGroup.extend({
  get associatedTable() {
    return ZTable.optional()
  },
  currentPagesState: SE.ZFormPagesState.optional(),
  currentRowUse: SE.ZCurrentRowUse.optional(),
  pagesRepresentation: SE.ZFormPagesRepresentation.optional(),
})

export const ZPagesXML = ZFormGroupXML.extend({
  get AssociatedTable() {
    return ZTableXML.optional()
  },
  CurrentPagesState: SE.ZFormPagesState.optional(),
  CurrentRowUse: SE.ZCurrentRowUse.optional(),
  PagesRepresentation: SE.ZFormPagesRepresentation.optional(),
})

export type TPages = z.infer<typeof ZPages>

export type TPagesXML = z.infer<typeof ZPagesXML>