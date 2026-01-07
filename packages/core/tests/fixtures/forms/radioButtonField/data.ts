import { RadioButtonField, RadioButtonFieldEnterprise } from "~/metadata/forms/elements/radioButtonField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullRadioButtonField: RadioButtonField = {
  elementType: FormElementType.RadioButtonField,
  name: "ПолеПереключателя",
  id: "1",
  title: {
    items: { ru: "Поле переключателя" },
  },
}

export const fullRadioButtonFieldEnterprise: RadioButtonFieldEnterprise = {
  Заголовок: "Поле переключателя",
}

export const minimalRadioButtonField: RadioButtonField = {
  elementType: FormElementType.RadioButtonField,
  name: "ПолеПереключателя",
  id: "1",
}

export const minimalRadioButtonFieldEnterprise: RadioButtonFieldEnterprise = {}

