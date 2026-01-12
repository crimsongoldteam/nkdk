import { Button, ButtonEnterprise, ButtonPropsEnterprise } from "~/metadata/forms/elements/button/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullButton: Button = {
  elementType: FormElementType.Button,
  name: "Кнопка",
  title: {
    items: { ru: "Кнопка формы" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  backColor: { type: "WebColor", value: "Blue" },
  borderColor: { type: "WebColor", value: "Green" },
  commandName: "Команда",
  commandUniqueness: true,
  dataPath: "Объект.Реквизит",
  defaultButton: true,
  defaultItem: true,
  displayImportance: "High",
  enabled: true,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 30,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  locationInCommandBar: "Auto",
  maxHeight: 100,
  maxWidth: 200,
  onlyInAllActions: true,
  picture: {
    type: "StandardPicture",
    ref: "Print",
    loadTransparent: true,
  },
  pictureLocation: "Left",
  representation: "Text",
  shape: "Oval",
  shapeRepresentation: "Always",
  shortcut: "Ctrl+A",
  skipOnInput: true,
  textColor: { type: "WebColor", value: "Yellow" },
  titleHeight: 20,
  toolTipRepresentation: "Auto",
  type: "UsualButton",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: true,
  width: 150,
}

export const fullButtonChildEnterprise: ButtonEnterprise = {
  Тип: "Кнопка",
  Заголовок: "Кнопка формы",
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  АктивизироватьПоУмолчанию: "Истина",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяКнопка",
  Видимость: "Истина",
  Высота: 30,
  ВысотаЗаголовка: 20,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ИмяКоманды: "Команда",
  Картинка: "Печать",
  КнопкаПоУмолчанию: "Истина",
  МаксимальнаяВысота: 100,
  МаксимальнаяШирина: 200,
  Отображение: "Текст",
  ОтображениеПодсказки: "Авто",
  ОтображениеФигуры: "Всегда",
  ПоложениеВКоманднойПанели: "Авто",
  ПоложениеКартинки: "Лево",
  РазрешитьИспользование: { Администратор: "Истина" },
  ПропускатьПриВводе: "Истина",
  ПутьКДанным: "Объект.Реквизит",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+A",
  ТолькоВоВсехДействиях: "Истина",
  УникальностьКоманды: "Истина",
  Фигура: "Овал",
  ЦветРамки: "Зеленый",
  ЦветТекста: "Желтый",
  ЦветФона: "Синий",
  Ширина: 150,
  Шрифт: "ОбычныйШрифтТекста",
}

export const fullButtonSource: Button = {
  elementType: FormElementType.Button,
  name: "Кнопка",
  title: { items: { ru: "Кнопка формы" } },
}

export const fullButtonEnterprise: ButtonPropsEnterprise = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  АктивизироватьПоУмолчанию: "Истина",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяКнопка",
  Видимость: "Истина",
  Высота: 30,
  ВысотаЗаголовка: 20,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ИмяКоманды: "Команда",
  Картинка: "Печать",
  КнопкаПоУмолчанию: "Истина",
  МаксимальнаяВысота: 100,
  МаксимальнаяШирина: 200,
  Отображение: "Текст",
  ОтображениеПодсказки: "Авто",
  ОтображениеФигуры: "Всегда",
  ПоложениеВКоманднойПанели: "Авто",
  ПоложениеКартинки: "Лево",
  РазрешитьИспользование: { Администратор: "Истина" },
  ПропускатьПриВводе: "Истина",
  ПутьКДанным: "Объект.Реквизит",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+A",
  ТолькоВоВсехДействиях: "Истина",
  УникальностьКоманды: "Истина",
  Фигура: "Овал",
  ЦветРамки: "Зеленый",
  ЦветТекста: "Желтый",
  ЦветФона: "Синий",
  Ширина: 150,
  Шрифт: "ОбычныйШрифтТекста",
}

export const minimalButton: Button = {
  elementType: FormElementType.Button,
  name: "Кнопка",
}

export const minimalButtonChildEnterprise: ButtonPropsEnterprise = {}

export const minimalButtonEnterprise: ButtonEnterprise = {
  ...minimalButtonChildEnterprise,
  Тип: "Кнопка",
}

export interface ButtonStructureFixture {
  name: string
  element: Button
  structured: IFormatElementResult
}

export const buttonStructureFixturesTable: ButtonStructureFixture[] = [
  {
    name: "with title",
    element: {
      name: "Заголовок",
      elementType: FormElementType.Button,
      title: { items: { ru: "Заголовок" } },
    },
    structured: {
      strings: ["<Заголовок {Заголовок}>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "without title",
    element: {
      name: "Кнопка",
      elementType: FormElementType.Button,
      title: undefined,
    },
    structured: {
      strings: ["<{Кнопка}>"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
