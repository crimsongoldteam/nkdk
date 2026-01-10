import { PictureField, PictureFieldEnterprise } from "~/metadata/forms/elements/pictureField/types"
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

export const fullPictureFieldEnterprise: PictureFieldEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле картинки",
}

export const minimalPictureField: PictureField = {
  elementType: FormElementType.PictureField,
  name: "ПолеКартинки",
}

export const minimalPictureFieldEnterprise: PictureFieldEnterprise = {}
