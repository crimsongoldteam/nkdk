import {
  ButtonGroup,
  ButtonGroupEnterprise,
  ButtonGroupPropsEnterprise,
} from "~/metadata/forms/elements/buttonGroup/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormGroupEnterprise } from "../formGroup/data"

export const fullButtonGroup: ButtonGroup = {
  elementType: FormElementType.ButtonGroup,
  enableContentChange: true,
  enabled: true,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: false,
  shortcut: "Ctrl+S",
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleTextColor: { type: "WebColor", value: "Black" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  type: "UsualGroup",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: true,
  width: 300,
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
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Истина",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ТолькоПросмотр: "Ложь",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  Заголовок: "Группа кнопок",
  Отображение: "Компактное",
  ПодчиненныеЭлементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
}

export const fullButtonGroupChildEnterprise: ButtonGroupEnterprise = {
  Тип: "ГруппаКнопок",
  Имя: "ГруппаКнопок",
  Заголовок: "Группа кнопок",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Истина",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ТолькоПросмотр: "Ложь",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  Отображение: "Компактное",
  ПодчиненныеЭлементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
}

export const fullButtonGroupPropsEnterprise: ButtonGroupPropsEnterprise = {
  ...fullFormGroupEnterprise,
  Заголовок: "Группа кнопок",
  Отображение: "Компактное",
  ПодчиненныеЭлементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
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
