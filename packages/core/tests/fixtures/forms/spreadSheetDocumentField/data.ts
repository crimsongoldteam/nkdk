import { SpreadSheetDocumentField, SpreadSheetDocumentFieldEnterprise } from "~/metadata/forms/elements/spreadSheetDocumentField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullSpreadSheetDocumentField: SpreadSheetDocumentField = {
  elementType: FormElementType.SpreadSheetDocumentField,
  name: "ПолеТабличногоДокумента",
  title: {
    items: { ru: "Поле табличного документа" },
  },
}

export const fullSpreadSheetDocumentFieldEnterprise: SpreadSheetDocumentFieldEnterprise = {
  Заголовок: "Поле табличного документа",
}

export const minimalSpreadSheetDocumentField: SpreadSheetDocumentField = {
  elementType: FormElementType.SpreadSheetDocumentField,
  name: "ПолеТабличногоДокумента",
}

export const minimalSpreadSheetDocumentFieldEnterprise: SpreadSheetDocumentFieldEnterprise = {}

