import {
  RadioButtonField,
  RadioButtonFieldPartialEnterprise,
  RadioButtonFieldTypedEnterprise,
} from "~/metadata/forms/elements/radioButtonField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullRadioButtonField: RadioButtonField = {
  ...fullFormField,
  elementType: FormElementType.RadioButtonField,
  name: "ПолеПереключателя",
  title: {
    items: { ru: "Поле переключателя" },
  },
}

export const fullRadioButtonFieldPartialEnterprise: RadioButtonFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле переключателя",
}

export const fullRadioButtonFieldTypedEnterprise: RadioButtonFieldTypedEnterprise = {
  ...fullRadioButtonFieldPartialEnterprise,
  Тип: "ПолеПереключателя",
}

export const minimalRadioButtonField: RadioButtonField = {
  elementType: FormElementType.RadioButtonField,
  name: "ПолеПереключателя",
}

export const minimalRadioButtonFieldPartialEnterprise: RadioButtonFieldPartialEnterprise = {}

export const minimalRadioButtonFieldTypedEnterprise: RadioButtonFieldTypedEnterprise = {
  Тип: "ПолеПереключателя",
}
