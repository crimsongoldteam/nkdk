import {
  TextDocumentField,
  TextDocumentFieldPartialEnterprise,
  TextDocumentFieldTypedEnterprise,
} from "~/metadata/forms/elements/textDocumentField/types"
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

export const fullTextDocumentFieldPartialEnterprise: TextDocumentFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле текстового документа",
}

export const fullTextDocumentFieldTypedEnterprise: TextDocumentFieldTypedEnterprise = {
  ...fullTextDocumentFieldPartialEnterprise,
  Тип: "ПолеТекстовогоДокумента",
}

export const minimalTextDocumentField: TextDocumentField = {
  elementType: FormElementType.TextDocumentField,
  name: "ПолеТекстовогоДокумента",
}

export const minimalTextDocumentFieldPartialEnterprise: TextDocumentFieldPartialEnterprise = {}

export const minimalTextDocumentFieldTypedEnterprise: TextDocumentFieldTypedEnterprise = {
  Тип: "ПолеТекстовогоДокумента",
}

