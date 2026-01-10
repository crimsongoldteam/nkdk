import { RadioButtonField, RadioButtonFieldEnterprise } from "~/metadata/forms/elements/radioButtonField/types"
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

export const fullRadioButtonFieldEnterprise: RadioButtonFieldEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле переключателя",
}

export const minimalRadioButtonField: RadioButtonField = {
  elementType: FormElementType.RadioButtonField,
  name: "ПолеПереключателя",
}

export const minimalRadioButtonFieldEnterprise: RadioButtonFieldEnterprise = {}
