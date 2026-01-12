import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
  SpreadSheetDocumentFieldTypedEnterprise,
} from "~/metadata/forms/elements/spreadSheetDocumentField/types"
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

export const fullSpreadSheetDocumentFieldPartialEnterprise: SpreadSheetDocumentFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле табличного документа",
}

export const fullSpreadSheetDocumentFieldTypedEnterprise: SpreadSheetDocumentFieldTypedEnterprise = {
  ...fullSpreadSheetDocumentFieldPartialEnterprise,
  Тип: "ПолеТабличногоДокумента",
}

export const minimalSpreadSheetDocumentField: SpreadSheetDocumentField = {
  elementType: FormElementType.SpreadSheetDocumentField,
  name: "ПолеТабличногоДокумента",
}

export const minimalSpreadSheetDocumentFieldPartialEnterprise: SpreadSheetDocumentFieldPartialEnterprise = {}

export const minimalSpreadSheetDocumentFieldTypedEnterprise: SpreadSheetDocumentFieldTypedEnterprise = {
  Тип: "ПолеТабличногоДокумента",
}
