import { TextDocumentField, TextDocumentFieldEnterprise } from "~/metadata/forms/elements/textDocumentField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullTextDocumentField: TextDocumentField = {
  elementType: FormElementType.TextDocumentField,
  name: "ПолеТекстовогоДокумента",
  id: "1",
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
  id: "1",
}

export const minimalTextDocumentFieldEnterprise: TextDocumentFieldEnterprise = {}

