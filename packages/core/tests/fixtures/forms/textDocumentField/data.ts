import { TextDocumentField, TextDocumentFieldEnterprise } from "~/metadata/forms/elements/textDocumentField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullTextDocumentField: TextDocumentField = {
  ...fullFormField,
  elementType: FormElementType.TextDocumentField,
  name: "ПолеТекстовогоДокумента",
  title: {
    items: { ru: "Поле текстового документа" },
  },
}

export const fullTextDocumentFieldEnterprise: TextDocumentFieldEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле текстового документа",
}

export const minimalTextDocumentField: TextDocumentField = {
  elementType: FormElementType.TextDocumentField,
  name: "ПолеТекстовогоДокумента",
}

export const minimalTextDocumentFieldEnterprise: TextDocumentFieldEnterprise = {}

