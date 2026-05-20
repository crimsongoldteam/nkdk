import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "~/metadata/forms/elements/extendedTooltip/types"

export const defaultExtendedTooltip: ExtendedTooltip = {
  itemType: "ExtendedTooltip",
}

export const parentElement: NamedElement = {
  itemType: "InputField",
  name: "КакойТоЭлемент",
}

export const otherParentElement: NamedElement = {
  itemType: "InputField",
  name: "ДругойЭлемент",
}

export const fullExtendedTooltip: ExtendedTooltip = {
  itemType: "ExtendedTooltip",
  width: 5,
  autoMaxWidth: false,
  maxWidth: 15,
  height: 10,
  autoMaxHeight: false,
  maxHeight: 20,
  horizontalStretch: false,
  verticalStretch: false,
  textColor: { type: "WebColor", value: "Violet" },
  font: { kind: "StyleItem", ref: "SmallTextFont" },
  title: {
    items: { ru: "Расширенная подсказка" },
    formatted: false,
  },
  horizontalAlignInGroup: "Right",
  verticalAlignInGroup: "Center",
  onMainServerUnavalableBehavior: "MakeDisable",
  hyperlink: true,
  verticalAlign: "Bottom",
  titleHeight: 3,
  backColor: { type: "WebColor", value: "BlueViolet" },
  borderColor: { type: "WebColor", value: "SkyBlue" },
  border: {
    width: 2,
    controlBorderType: "Overline",
  },
  displayImportance: "VeryHigh",
  events: {
    click: "КнопкаРасширеннаяПодсказкаНажатие",
    uRLProcessing: "КнопкаРасширеннаяПодсказкаОбработкаНавигационнойСсылки",
  },
}

export const formattedEmptyTitleExtendedTooltip: ExtendedTooltip = {
  itemType: "ExtendedTooltip",
  width: 14,
  title: {
    formatted: true,
    items: {},
  },
}

export const fullExtendedTooltipYAML: ExtendedTooltipYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  ВажностьПриОтображении: "ОченьВысокая",
  ВертикальноеПоложение: "Низ",
  ВертикальноеПоложениеВГруппе: "Центр",
  Высота: 10,
  ВысотаЗаголовка: 3,
  Гиперссылка: "Истина",
  ГоризонтальноеПоложениеВГруппе: "Право",
  Заголовок: "Расширенная подсказка",
  МаксимальнаяВысота: 20,
  МаксимальнаяШирина: 15,
  ПоведениеПриНедоступностиОсновногоСервера: "ОтключитьДоступность",
  Рамка: {
    Имя: undefined,
    Ширина: 2,
    ТипРамки: "ЧертаСверху",
  },
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  События: {
    Нажатие: "КнопкаРасширеннаяПодсказкаНажатие",
    ОбработкаНавигационнойСсылки: "КнопкаРасширеннаяПодсказкаОбработкаНавигационнойСсылки",
  },
  ЦветРамки: "НебесноГолубой",
  ЦветТекста: "Фиолетовый",
  ЦветФона: "СинеФиолетовый",
  Ширина: 5,
  Шрифт: { Вид: "МелкийШрифтТекста" },
}

export const minimalExtendedTooltip: ExtendedTooltip = {
  itemType: "ExtendedTooltip",
}

export const minimalExtendedTooltipYAML: ExtendedTooltipYAML = {}
