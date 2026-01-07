import { TrackBarField, TrackBarFieldEnterprise } from "~/metadata/forms/elements/trackBarField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullTrackBarField: TrackBarField = {
  elementType: FormElementType.TrackBarField,
  name: "ПолеПолосыПрокрутки",
  id: "1",
  title: {
    items: { ru: "Поле полосы прокрутки" },
  },
}

export const fullTrackBarFieldEnterprise: TrackBarFieldEnterprise = {
  Заголовок: "Поле полосы прокрутки",
}

export const minimalTrackBarField: TrackBarField = {
  elementType: FormElementType.TrackBarField,
  name: "ПолеПолосыПрокрутки",
  id: "1",
}

export const minimalTrackBarFieldEnterprise: TrackBarFieldEnterprise = {}

