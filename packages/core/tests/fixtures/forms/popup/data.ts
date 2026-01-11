import { Popup, PopupEnterprise } from "~/metadata/forms/elements/popup/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormGroup, fullFormGroupEnterprise } from "../formGroup/data"

export const fullPopup: Popup = {
  ...fullFormGroup,
  elementType: FormElementType.Popup,
  name: "ВсплывающееОкно",
  title: {
    items: { ru: "Всплывающее окно" },
  },
  backColor: { type: "WebColor", value: "White" },
  borderColor: { type: "WebColor", value: "Gray" },
  picture: undefined,
  representation: "Text",
  shape: "Usual",
  shapeRepresentation: "Auto",
}

export const fullPopupEnterprise: PopupEnterprise = {
  Тип: "Подменю",
  ...fullFormGroupEnterprise,
  Заголовок: "Всплывающее окно",
  Отображение: "Текст",
  ОтображениеФигуры: "Авто",
  Фигура: "Обычная",
  ЦветРамки: "Серый",
  ЦветФона: "Белый",
}

export const minimalPopup: Popup = {
  elementType: FormElementType.Popup,
  name: "ВсплывающееОкно",
  childItems: [],
}

export const minimalPopupEnterprise: PopupEnterprise = {
  Тип: "Подменю",
}
