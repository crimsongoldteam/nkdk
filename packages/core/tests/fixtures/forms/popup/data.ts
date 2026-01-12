import {
  Popup,
  PopupPartialEnterprise,
  PopupTypedEnterprise,
} from "~/metadata/forms/elements/popup/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormGroup, fullFormGroupPartialEnterprise } from "../formGroup/data"

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
  childItems: [],
}

export const fullPopupPartialEnterprise: PopupPartialEnterprise = {
  ...fullFormGroupPartialEnterprise,
  Отображение: "Текст",
  ОтображениеФигуры: "Авто",
  Фигура: "Обычная",
  ЦветРамки: "Серый",
  ЦветФона: "Белый",
  // Заголовок не включается в partial, так как он в defaultLanguage
}

export const fullPopupTypedEnterprise: PopupTypedEnterprise = {
  ...fullPopupPartialEnterprise,
  Тип: "Подменю",
  Заголовок: "Всплывающее окно",
}

export const minimalPopup: Popup = {
  elementType: FormElementType.Popup,
  name: "ВсплывающееОкно",
  childItems: [],
}

export const minimalPopupPartialEnterprise: PopupPartialEnterprise = {}

export const minimalPopupTypedEnterprise: PopupTypedEnterprise = {
  Тип: "Подменю",
}
