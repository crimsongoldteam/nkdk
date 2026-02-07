import { Button, ButtonPartialEnterprise, ButtonTypedEnterprise } from "~/metadata/forms/elements/button/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullButton: Required<Button> = {
  elementType: FormElementType.Button,
  autoMaxHeight: false,
  autoMaxWidth: false,
  backColor: {
    type: "WebColor",
    value: "Red",
  },
  borderColor: {
    type: "WebColor",
    value: "Green",
  },
  check: true,
  commandName: "Form.Command.КакаяТоКоманда",
  commandUniqueness: false,
  defaultButton: true,
  defaultItem: true,
  displayImportance: "VeryHigh",
  enabled: false,
  extendedTooltip: {
    title: {
      formatted: false,
      items: {
        ru: "Расширенная подсказка",
      },
    },
  },
  font: {
    kind: "StyleItem",
    ref: "LargeTextFont",
  },
  height: 5,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  locationInCommandBar: "InAdditionalSubmenu",
  maxHeight: 2,
  maxWidth: 1,
  name: "ОбычнаяКнопка",
  onlyInAllActions: true, //deprecated in 8.3.15
  onMainServerUnavalableBehavior: "DontChangeBehavior",
  picture: {
    loadTransparent: true,
    ref: "Print",
    transparentPixel: undefined,
    type: "StandardPicture",
  },
  pictureLocation: "Left",
  representation: "PictureAndText",
  representationInContextMenu: "AdditionalInContextMenu",
  shape: "Oval",
  shapeRepresentation: "Always",
  skipOnInput: true,
  textColor: {
    type: "WebColor",
    value: "Blue",
  },
  title: {
    items: {
      ru: "Заголовок кнопки",
    },
  },
  titleHeight: 3,
  toolTipRepresentation: "Balloon",
  type: "UsualButton",
  userVisible: {
    common: true,
    values: [
      {
        name: "Администратор",
        value: true,
      },
    ],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: false,
  width: 10,
}

export const fullButtonTypedEnterprise: ButtonTypedEnterprise = {
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

export const fullButtonPartialEnterprise: ButtonPartialEnterprise = {
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

export const minimalButtonPartialEnterprise: ButtonPartialEnterprise = {}

export const minimalButtonTypedEnterprise: ButtonTypedEnterprise = {
  ...minimalButtonPartialEnterprise,
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
