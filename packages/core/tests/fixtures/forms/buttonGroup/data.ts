import { ButtonGroup, ButtonGroupEnterprise } from "~/metadata/forms/elements/buttonGroup/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullButtonGroup: ButtonGroup = {
  elementType: FormElementType.ButtonGroup,
  name: "ГруппаКнопок",
  id: "1",
  childItems: [],
  representation: "Compact",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
}

export const fullButtonGroupEnterprise: ButtonGroupEnterprise = {
  Отображение: "Компактное",
  РазрешитьИспользование: { Администратор: "Истина" },
}

export const minimalButtonGroup: ButtonGroup = {
  elementType: FormElementType.ButtonGroup,
  name: "ГруппаКнопок",
  id: "1",
  childItems: [],
}

export const minimalButtonGroupEnterprise: ButtonGroupEnterprise = {}

