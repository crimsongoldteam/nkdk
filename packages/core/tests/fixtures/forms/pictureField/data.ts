import { PictureField, PictureFieldEnterprise } from "~/metadata/forms/elements/pictureField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullPictureField: PictureField = {
  elementType: FormElementType.PictureField,
  name: "ПолеКартинки",
  title: {
    items: { ru: "Поле картинки" },
  },
}

export const fullPictureFieldEnterprise: PictureFieldEnterprise = {
  Заголовок: "Поле картинки",
}

export const minimalPictureField: PictureField = {
  elementType: FormElementType.PictureField,
  name: "ПолеКартинки",
}

export const minimalPictureFieldEnterprise: PictureFieldEnterprise = {}

