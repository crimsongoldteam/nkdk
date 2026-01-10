import { SpreadSheetDocumentField, SpreadSheetDocumentFieldEnterprise } from "~/metadata/forms/elements/spreadSheetDocumentField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullSpreadSheetDocumentField: SpreadSheetDocumentField = {
  ...fullFormField,
  elementType: FormElementType.SpreadSheetDocumentField,
  name: "ПолеТабличногоДокумента",
  title: {
    items: { ru: "Поле табличного документа" },
  },
}

export const fullSpreadSheetDocumentFieldEnterprise: SpreadSheetDocumentFieldEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле табличного документа",
}

export const minimalSpreadSheetDocumentField: SpreadSheetDocumentField = {
  elementType: FormElementType.SpreadSheetDocumentField,
  name: "ПолеТабличногоДокумента",
}

export const minimalSpreadSheetDocumentFieldEnterprise: SpreadSheetDocumentFieldEnterprise = {}

