import {
  ButtonGroup,
  ButtonGroupEnterprise,
  ButtonGroupPropsEnterprise,
} from "~/metadata/forms/elements/buttonGroup/types"
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

export const fullButtonGroupSource: ButtonGroup = {
  elementType: FormElementType.ButtonGroup,
  name: "ГруппаКнопок",
  title: { items: { ru: "Группа кнопок" } },
  childItems: [],
}

export const fullButtonGroupEnterprise: ButtonGroupEnterprise = {
  Тип: "ГруппаКнопок",
  Имя: "ГруппаКнопок",
  ...fullFormGroupEnterprise,
  Заголовок: "Группа кнопок",
  Отображение: "Компактное",
  ПодчиненныеЭлементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
}

export const fullButtonGroupChildEnterprise: ButtonGroupPropsEnterprise = {
  ...fullFormGroupEnterprise,
  Отображение: "Компактное",
  ПодчиненныеЭлементы: [
    {
      Кнопка: {
        Тип: "Кнопка",
      },
    },
  ],
}

export const minimalButtonGroup: ButtonGroup = {
  elementType: FormElementType.ButtonGroup,
  name: "ГруппаКнопок",
  childItems: [],
}

export const minimalButtonGroupEnterprise: ButtonGroupEnterprise = {
  Тип: "ГруппаКнопок",
  Имя: "ГруппаКнопок",
}
