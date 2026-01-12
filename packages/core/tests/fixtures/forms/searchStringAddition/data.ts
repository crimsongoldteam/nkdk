import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
} from "~/metadata/forms/elements/searchStringAddition/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormItemAddition, fullFormItemAdditionPartialEnterprise } from "../formItemAddition/data"

export const parentElement: BaseElement = {
  elementType: FormElementType.Form,
  name: "КакойТоЭлемент",
}

export const fullSearchStringAddition: SearchStringAddition = {
  backColor: { type: "WebColor", value: "White" },
  borderColor: { type: "WebColor", value: "Black" },
  displayImportance: fullFormItemAddition.displayImportance,
  enabled: fullFormItemAddition.enabled,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  horizontalAlignInGroup: fullFormItemAddition.horizontalAlignInGroup,
  horizontalStretch: true,
  textColor: { type: "WebColor", value: "Black" },
  title: fullFormItemAddition.title,
  toolTip: fullFormItemAddition.toolTip,
  toolTipRepresentation: fullFormItemAddition.toolTipRepresentation,
  userVisible: fullFormItemAddition.userVisible,
  verticalAlignInGroup: fullFormItemAddition.verticalAlignInGroup,
  visible: fullFormItemAddition.visible,
  width: 300,
}

export const fullSearchStringAdditionEnterprise: SearchStringAdditionEnterprise = {
  ВажностьПриОтображении: fullFormItemAdditionPartialEnterprise.ВажностьПриОтображении,
  ВертикальноеПоложениеВГруппе: fullFormItemAdditionPartialEnterprise.ВертикальноеПоложениеВГруппе,
  Видимость: fullFormItemAdditionPartialEnterprise.Видимость,
  ГоризонтальноеПоложениеВГруппе: fullFormItemAdditionPartialEnterprise.ГоризонтальноеПоложениеВГруппе,
  Доступность: fullFormItemAdditionPartialEnterprise.Доступность,
  Заголовок: "Добавление элемента формы",
  ОтображениеПодсказки: fullFormItemAdditionPartialEnterprise.ОтображениеПодсказки,
  Подсказка: fullFormItemAdditionPartialEnterprise.Подсказка,
  РазрешитьИспользование: fullFormItemAdditionPartialEnterprise.РазрешитьИспользование,
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Черный",
  ЦветТекста: "Черный",
  ЦветФона: "Белый",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
}

export const minimalSearchStringAddition: SearchStringAddition = {}
