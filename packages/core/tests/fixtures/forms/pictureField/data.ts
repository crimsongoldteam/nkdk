import {
  PictureField,
  PictureFieldPartialEnterprise,
  PictureFieldTypedEnterprise,
} from "~/metadata/forms/elements/pictureField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullPictureField: PictureField = {
  ...fullFormField,
  elementType: FormElementType.PictureField,
  name: "ПолеКартинки",
  title: {
    items: { ru: "Поле картинки" },
  },
}

export const fullPictureFieldPartialEnterprise: PictureFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле картинки",
}

export const fullPictureFieldTypedEnterprise: PictureFieldTypedEnterprise = {
  ...fullPictureFieldPartialEnterprise,
  Тип: "ПолеРисунка",
}

export const minimalPictureField: PictureField = {
  elementType: FormElementType.PictureField,
  name: "ПолеКартинки",
}

export const minimalPictureFieldPartialEnterprise: PictureFieldPartialEnterprise = {}

export const minimalPictureFieldTypedEnterprise: PictureFieldTypedEnterprise = {
  Тип: "ПолеРисунка",
}
