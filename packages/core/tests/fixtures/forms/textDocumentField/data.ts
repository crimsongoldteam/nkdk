import { TextDocumentField, TextDocumentFieldEnterprise } from "~/metadata/forms/elements/textDocumentField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullTextDocumentField: TextDocumentField = {
  elementType: FormElementType.TextDocumentField,
  name: "ПолеТекстовогоДокумента",
  title: {
    items: { ru: "Поле текстового документа" },
  },
}

export const fullTextDocumentFieldEnterprise: TextDocumentFieldEnterprise = {
  Заголовок: "Поле текстового документа",
}

export const minimalTextDocumentField: TextDocumentField = {
  elementType: FormElementType.TextDocumentField,
  name: "ПолеТекстовогоДокумента",
}

export const minimalTextDocumentFieldEnterprise: TextDocumentFieldEnterprise = {}

