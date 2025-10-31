import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZTable, ZTableXML } from "../table/types"

export const ZPages = ZFormGroup.extend({
  currentRowUse: SE.ZCurrentRowUse.optional(),
  get associatedTable() {
    return ZTable.optional()
  },
  pagesRepresentation: SE.ZFormPagesRepresentation.optional(),
  currentPagesState: SE.ZFormPagesState.optional(),
})

export const ZPagesXML = ZFormGroupXML.extend({
  CurrentRowUse: SE.ZCurrentRowUse.optional(),
  get AssociatedTable() {
    return ZTableXML.optional()
  },
  PagesRepresentation: SE.ZFormPagesRepresentation.optional(),
  CurrentPagesState: SE.ZFormPagesState.optional(),
})

export type TPages = z.infer<typeof ZPages>

export type TPagesXML = z.infer<typeof ZPagesXML>