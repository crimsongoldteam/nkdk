import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { CommandBar, CommandBarPartialYAML } from "~/metadata/forms/elements/commandBar/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import {
  fullCommandBarChildItemsAllYAML,
  fullCommandBarChildItemsStructure,
  fullCommandBarChildItemsTyped,
} from "../../commandBarChildItems/data"

export const parentElement: NamedElement = {
  name: "КоманднаяПанель",
  itemType: CollectionFormElementType.Table,
}

export const sourceCommandBar: CommandBar = {
  itemType: CollectionFormElementType.CommandBar,
  name: "КоманднаяПанель",
  childItems: fullCommandBarChildItemsStructure,
  title: {
    items: { ru: "Командная панель" },
  },
}

export const fullCommandBar: Required<CommandBar> = {
  itemType: CollectionFormElementType.CommandBar,
  name: "КоманднаяПанель",
  enableContentChange: true,
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
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
  commandSource: "Form",
  childItems: fullCommandBarChildItemsTyped,
}

export const fullCommandBarAllItems = fullCommandBarChildItemsAllYAML

export const minimalCommandBar: CommandBar = {
  itemType: CollectionFormElementType.CommandBar,
  name: "КоманднаяПанель",
  childItems: [],
}

export const fullCommandBarSource: CommandBar = {
  ...fullCommandBar,
  childItems: fullCommandBarChildItemsStructure,
}

export const minimalCommandBarPartialYAML: CommandBarPartialYAML = {}

export const fullCommandBarPartialYAML: CommandBarPartialYAML = {
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
  РасширеннаяПодсказка: {
    Заголовок: "Расширенная подсказка",
  },
  СочетаниеКлавиш: "Ctrl+S",
  ТолькоПросмотр: "Ложь",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  Автозаполнение: "Истина",
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
  ИсточникКоманд: "Form",
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
      itemType: CollectionFormElementType.CommandBar,
      childItems: [
        {
          itemType: CollectionFormElementType.Button,
          name: "Кнопка1",
          title: { items: { ru: "Кнопка Номер 1" } },
        },
        {
          itemType: CollectionFormElementType.Button,
          name: "Кнопка2",
          title: { items: { ru: "Кнопка Номер 2" } },
        },
        {
          itemType: CollectionFormElementType.Button,
          name: "Кнопка3",
          title: { items: { ru: "Кнопка Номер 3" } },
        },
      ],
    },
    structured: {
      strings: ["<Кнопка Номер 1 %Кнопка1 | Кнопка Номер 2 %Кнопка2 | Кнопка Номер 3 %Кнопка3> %КоманднаяПанель"],
      haveSimpleHorizontalGroup: false,
    },
  },

  {
    name: "with button group",
    element: {
      name: "КоманднаяПанель",
      itemType: CollectionFormElementType.CommandBar,
      childItems: [
        {
          itemType: CollectionFormElementType.ButtonGroup,
          name: "ГруппаКнопок1",
          childItems: [],
          title: { items: { ru: "Группа кнопок" } },
        },
      ],
    },
    structured: {
      strings: ["<-Группа кнопок %ГруппаКнопок1> %КоманднаяПанель"],
      haveSimpleHorizontalGroup: false,
    },
  },

  {
    name: "with popup",
    element: {
      name: "КоманднаяПанель",
      itemType: CollectionFormElementType.CommandBar,
      childItems: [
        {
          itemType: CollectionFormElementType.Popup,
          name: "Меню",
          title: { items: { ru: "Выпадающее меню" } },
          childItems: [],
        },
      ],
    },
    structured: {
      strings: ["<+Выпадающее меню %Меню> %КоманднаяПанель"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "with search control addition",
    element: {
      name: "КоманднаяПанель",
      itemType: CollectionFormElementType.CommandBar,
      childItems: [
        {
          itemType: CollectionFormElementType.SearchControlAddition,
          name: "Дополнение",
          childItems: [],
        },
      ],
    },
    structured: {
      strings: ["<?УправлениеПоиском %Дополнение> %КоманднаяПанель"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "with search string addition",
    element: {
      name: "КоманднаяПанель",
      itemType: CollectionFormElementType.CommandBar,
      childItems: [
        {
          itemType: CollectionFormElementType.SearchStringAddition,
          name: "Дополнение",
        },
      ],
    },
    structured: {
      strings: ["<?ОтображениеСтрокиПоиска %Дополнение> %КоманднаяПанель"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
