import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import {
  CommandBar,
  CommandBarPartialEnterprise,
  CommandBarTypedEnterprise,
} from "~/metadata/forms/elements/commandBar/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullCommandBarChildItemsAllEnterprise,
  fullCommandBarChildItemsStructure,
  fullCommandBarChildItemsTyped,
} from "../../commandBarChildItems/data"

export const parentElement: NamedElement = {
  name: "КоманднаяПанель",
  elementType: FormElementType.BaseElement,
}

export const sourceCommandBar: CommandBar = {
  elementType: FormElementType.CommandBar,
  name: "КоманднаяПанель",
  childItems: fullCommandBarChildItemsStructure,
  title: {
    items: { ru: "Командная панель" },
  },
}

export const fullCommandBar: Omit<Required<CommandBar>, "extendedTooltip"> = {
  elementType: FormElementType.CommandBar,
  name: "КоманднаяПанель",
  enableContentChange: true,
  enabled: true,
  height: 200,
  horizontalAlignInGroup: "Center",
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
  childItems: fullCommandBarChildItemsTyped,
}

export const fullCommandBarAllItems = fullCommandBarChildItemsAllEnterprise

export const minimalCommandBar: CommandBar = {
  elementType: FormElementType.CommandBar,
  name: "КоманднаяПанель",
  childItems: [],
}

export const minimalCommandBarPartialEnterprise: CommandBarPartialEnterprise = {}

export const fullCommandBarPartialEnterprise: CommandBarPartialEnterprise = {
  Заголовок: "Командная панель",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Центр",
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

export const fullCommandBarTypedEnterprise: CommandBarTypedEnterprise = {
  ...fullCommandBarPartialEnterprise,
  Тип: "КоманднаяПанель",
  Заголовок: "Командная панель",
}

export const minimalCommandBarTypedEnterprise: CommandBarTypedEnterprise = {
  Тип: "КоманднаяПанель",
}

export interface CommandBarStructureFixture {
  name: string
  element: CommandBar
  structured: IFormatElementResult
}

export const commandBarStructureFixturesTable: CommandBarStructureFixture[] = [
  {
    name: "with buttons",
    element: {
      name: "КоманднаяПанель",
      elementType: FormElementType.CommandBar,
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Кнопка1",
          title: { items: { ru: "Кнопка Номер 1" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Кнопка2",
          title: { items: { ru: "Кнопка Номер 2" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Кнопка3",
          title: { items: { ru: "Кнопка Номер 3" } },
        },
      ],
    },
    structured: {
      strings: ["<Кнопка Номер 1 {Кнопка1} | Кнопка Номер 2 {Кнопка2} | Кнопка Номер 3 {Кнопка3}> {КоманднаяПанель}"],
      haveSimpleHorizontalGroup: false,
    },
  },

  {
    name: "with button group",
    element: {
      name: "КоманднаяПанель",
      elementType: FormElementType.CommandBar,
      childItems: [
        {
          elementType: FormElementType.ButtonGroup,
          name: "ГруппаКнопок1",
          childItems: [],
          title: { items: { ru: "Группа кнопок" } },
        },
      ],
    },
    structured: {
      strings: ["<#Группа кнопок {ГруппаКнопок1} |> {КоманднаяПанель}"],
      haveSimpleHorizontalGroup: false,
    },
  },

  {
    name: "with popup",
    element: {
      name: "КоманднаяПанель",
      elementType: FormElementType.CommandBar,
      childItems: [
        {
          elementType: FormElementType.Popup,
          name: "Меню",
          title: { items: { ru: "Выпадающее меню" } },
          childItems: [],
        },
      ],
    },
    structured: {
      strings: ["<^Выпадающее меню {Меню}> {КоманднаяПанель}"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
