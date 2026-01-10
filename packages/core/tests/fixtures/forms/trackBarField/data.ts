import { TrackBarField, TrackBarFieldEnterprise } from "~/metadata/forms/elements/trackBarField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullTrackBarField: TrackBarField = {
  ...fullFormField,
  elementType: FormElementType.TrackBarField,
  name: "ПолеПолосыПрокрутки",
  title: {
    items: { ru: "Поле полосы прокрутки" },
  },
}

export const fullTrackBarFieldEnterprise: TrackBarFieldEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле полосы прокрутки",
}

export const minimalTrackBarField: TrackBarField = {
  elementType: FormElementType.TrackBarField,
  name: "ПолеПолосыПрокрутки",
}

export const minimalTrackBarFieldEnterprise: TrackBarFieldEnterprise = {}

