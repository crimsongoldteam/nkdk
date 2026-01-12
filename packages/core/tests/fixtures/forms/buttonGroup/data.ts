import { ButtonGroup, ButtonGroupPropsEnterprise } from "~/metadata/forms/elements/buttonGroup/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormGroup, fullFormGroupEnterprise } from "../formGroup/data"

export const fullButtonGroup: ButtonGroup = {
  ...fullFormGroup,
  elementType: FormElementType.ButtonGroup,
  name: "ГруппаКнопок",
  childItems: [
    {
      elementType: FormElementType.Button,
      name: "Кнопка",
    },
  ],
  title: {
    items: { ru: "Группа кнопок" },
  },
  representation: "Compact",
}

export const fullButtonGroupEnterprise: ButtonGroupPropsEnterprise = {
  Тип: "ГруппаКнопок",
  ...fullFormGroupEnterprise,
  Заголовок: "Группа кнопок",
  Отображение: "Компактное",
}

export const minimalButtonGroup: ButtonGroup = {
  elementType: FormElementType.ButtonGroup,
  name: "ГруппаКнопок",
  childItems: [],
}

export const minimalButtonGroupEnterprise: ButtonGroupPropsEnterprise = {
  Тип: "ГруппаКнопок",
}
