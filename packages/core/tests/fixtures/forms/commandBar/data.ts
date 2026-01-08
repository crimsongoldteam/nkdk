import { IFormatElementResult } from "~/format/types"
import { CommandBar, CommandBarEnterprise } from "~/metadata/forms/elements/commandBar/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullCommandBar: CommandBar = {
  elementType: FormElementType.CommandBar,
  name: "КоманднаяПанель",
  id: "1",
  childItems: [],
  enableContentChange: true,
  enabled: true,
  extendedTooltip: undefined,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: false,
  shortcut: "Ctrl+S",
  title: {
    items: { ru: "Командная панель" },
  },
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
  autofill: true,
  displayImportance: "High",
  horizontalAlign: "Left",
}

export const fullCommandBarEnterprise: CommandBarEnterprise = {
  Заголовок: "Командная панель",
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
  Автозаполнение: "Истина",
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
}

export const minimalCommandBar: CommandBar = {
  elementType: FormElementType.CommandBar,
  name: "КоманднаяПанель",
  id: "1",
  childItems: [],
}

export const minimalCommandBarEnterprise: CommandBarEnterprise = {}

export interface CommandBarStructureFixture {
  name: string
  element: CommandBar
  structured: IFormatElementResult
}

export const commandBarStructureFixturesTable: CommandBarStructureFixture[] = [
  {
    name: "with buttons",
    element: {
      name: "CommandBar",
      elementType: FormElementType.CommandBar,
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Button1",
          id: "1",
          title: { items: { ru: "Button1" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Button2",
          id: "2",
          title: { items: { ru: "Button2" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Button3",
          id: "3",
          title: { items: { ru: "Button3" } },
        },
      ],
      id: "1",
    },
    structured: {
      strings: ["<Button1|Button2|Button3>"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
