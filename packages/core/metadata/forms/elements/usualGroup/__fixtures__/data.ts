import { InputField } from "~/metadata/forms/elements/inputField/types"
import {
  UsualGroup,
  UsualGroupEnterprise,
  UsualGroupPartialYAML,
  UsualGroupTypedYAML,
} from "~/metadata/forms/elements/usualGroup/types"

import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { RequiredFieldsElement } from "~/tests/types"
import {
  minimalInputField,
  minimalInputFieldEnterprise,
} from "~/metadata/forms/elements/inputField/__fixtures__/data"

export const fullUsualGroup: RequiredFieldsElement<UsualGroup> = {
  itemType: "UsualGroup",
  name: "ОбычнаяГруппа",
  enableContentChange: true,
  enabled: false,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: true,
  shortcut: "Shift+F",
  showTitle: false,
  title: {
    items: { ru: "Обычная группа" },
  },
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleTextColor: { type: "WebColor", value: "Black" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: false,
  width: 300,
  backColor: { type: "WebColor", value: "White" },
  behavior: "Collapsible",
  childItemsHorizontalAlign: "Center",
  childItemsVerticalAlign: "Bottom",
  collapsed: true,
  collapsedRepresentationTitle: {
    items: { ru: "Заголовок свернутого отображения" },
  },
  controlRepresentation: "Picture",
  currentRowUse: "DontUse",
  displayImportance: "High",
  format: {
    items: { ru: "БЛ=Выключено" },
  },
  group: "Vertical",
  hiddenRepresentationTitleBackColor: { type: "WebColor", value: "Gold" },
  horizontalSpacing: "Single",
  itemsAndTitlesAlign: "ItemsLeftTitlesLeft",
  representation: "NormalSeparation",
  showLeftMargin: false,
  throughAlign: "DontUse",
  titleDataPath: "ТекстовыйРеквизит",
  united: false,
  verticalSpacing: "Single",
  table: "ИспользуемаяТаблица",
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
  childItems: [minimalInputField],
}

export const fullUsualGroupSource: UsualGroup = {
  itemType: "UsualGroup",
  name: "ОбычнаяГруппа",
  title: { items: { ru: "Обычная группа" } },
  group: "HorizontalIfPossible",
  showTitle: true,
  childItems: [],
}

export const fullUsualGroupPartialYAML: Required<
  Omit<UsualGroupPartialYAML, "Заголовок" | "ЗапретитьИспользование" | "Группировка" | "ОтображатьЗаголовок">
> = {
  ВертикальноеПоложениеВГруппе: "Верх",
  Видимость: "Ложь",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Ложь",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Истина",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  СочетаниеКлавиш: "Shift+F",
  ТолькоПросмотр: "Истина",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеПодчиненных: "Низ",
  ВертикальныйИнтервал: "Одинарный",
  ВыравниваниеЭлементовИЗаголовков: "ЭлементыЛевоЗаголовкиЛево",
  ГоризонтальноеПоложениеПодчиненных: "Центр",
  ГоризонтальныйИнтервал: "Одинарный",
  // Группировка: "Вертикальная",
  ЗаголовокСвернутогоОтображения: "Заголовок свернутого отображения",
  ИспользованиеТекущейСтроки: "НеИспользует",
  Объединенная: "Ложь",
  // ОтображатьЗаголовок: "Ложь",
  ОтображатьОтступСлева: "Ложь",
  Отображение: "ОбычноеВыделение",
  ОтображениеУправления: "Картинка",
  Поведение: "Свертываемая",
  ПутьКДаннымЗаголовка: "ТекстовыйРеквизит",
  СквозноеВыравнивание: "НеИспользовать",
  Свернута: "Истина",
  Формат: "БЛ=Выключено",
  ЦветФона: "Белый",
  ЦветФонаЗаголовкаСкрытогоОтображения: "Золотой",
  Таблица: "ИспользуемаяТаблица",
}

export const fullUsualGroupTypedYAML: UsualGroupTypedYAML = {
  ...fullUsualGroupPartialYAML,
  Тип: "Группа",
  Заголовок: "Обычная группа",
}

export const fullUsualGroupEnterprise = {
  BackColor: { Type: "Color", Value: "WebColors.White" },
  Behavior: { Type: "SystemEnumeration", Value: "UsualGroupBehavior.Collapsible" },
  ChildItemsHorizontalAlign: { Type: "SystemEnumeration", Value: "ItemHorizontalLocation.Center" },
  ChildItemsVerticalAlign: { Type: "SystemEnumeration", Value: "ItemVerticalAlign.Bottom" },
  Collapsed: true,
  CollapsedRepresentationTitle: "Заголовок свернутого отображения",
  ControlRepresentation: { Type: "SystemEnumeration", Value: "UsualGroupControlRepresentation.Picture" },
  CurrentRowUse: { Type: "SystemEnumeration", Value: "CurrentRowUse.DontUse" },
  DisplayImportance: { Type: "SystemEnumeration", Value: "DisplayImportance.High" },
  ElementType: "FormGroup",
  EnableContentChange: true,
  Enabled: false,
  Format: "БЛ=Выключено",
  Group: { Type: "SystemEnumeration", Value: "ChildFormItemsGroup.Vertical" },
  Height: 200,
  HiddenRepresentationTitleBackColor: { Type: "Color", Value: "WebColors.Gold" },
  HorizontalAlignInGroup: { Type: "SystemEnumeration", Value: "ItemHorizontalLocation.Left" },
  HorizontalSpacing: { Type: "SystemEnumeration", Value: "FormItemSpacing.Single" },
  HorizontalStretch: true,
  ItemsAndTitlesAlign: { Type: "SystemEnumeration", Value: "ItemsAndTitlesAlignVariant.ItemsLeftTitlesLeft" },
  Name: "prefix_ОбычнаяГруппа",
  ReadOnly: true,
  Representation: { Type: "SystemEnumeration", Value: "UsualGroupRepresentation.NormalSeparation" },
  ShowLeftMargin: false,
  ShowTitle: false,
  ThroughAlign: { Type: "SystemEnumeration", Value: "ThroughAlign.DontUse" },
  Title: "Обычная группа",
  TitleDataPath: "prefix_ТекстовыйРеквизит",
  TitleTextColor: { Type: "Color", Value: "WebColors.Black" },
  ToolTip: "Подсказка",
  ToolTipRepresentation: { Type: "SystemEnumeration", Value: "ToolTipRepresentation.None" },
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.UsualGroup" },
  United: false,
  VerticalAlignInGroup: { Type: "SystemEnumeration", Value: "ItemVerticalAlign.Top" },
  VerticalSpacing: { Type: "SystemEnumeration", Value: "FormItemSpacing.Single" },
  VerticalStretch: true,
  Visible: false,
  Width: 300,
  ChildItems: [minimalInputFieldEnterprise],
  TitleFont: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
} satisfies Required<UsualGroupEnterprise>

export const minimalUsualGroup: UsualGroup = {
  itemType: "UsualGroup",
  name: "ОбычнаяГруппа",
  group: "HorizontalIfPossible",
  showTitle: true,
  childItems: [],
}

export const minimalUsualGroupPartialYAML: UsualGroupPartialYAML = {}

export const minimalUsualGroupTypedYAML: UsualGroupTypedYAML = {
  Тип: "Группа",
}

export interface StructureFixture<T> {
  name: string
  element: T
  structured: ToNKDKResult
}

export type StructureFixturesTable<T> = StructureFixture<T>[]

export const usualGroupStructureFixtures: StructureFixturesTable<UsualGroup> = [
  {
    name: "one-line group without title",
    element: {
      name: "Группа",
      itemType: "UsualGroup",
      group: "AlwaysHorizontal",
      showTitle: false,
      childItems: [
        {
          name: "Элемент1",
          dataPath: "Элемент1",
          itemType: "InputField",
        } as InputField,
        {
          name: "Элемент2",
          dataPath: "Элемент2",
          itemType: "InputField",
        } as InputField,
      ],
    },
    structured: {
      strings: ["=Группа Элемент1: ; Элемент2:"],
      toOneLineGroup: false,
    },
  },
  {
    name: "one-line group with title",
    element: {
      name: "Группа",
      itemType: "UsualGroup",
      group: "AlwaysHorizontal",
      showTitle: true,
      title: { items: { ru: "Заголовок группы" } },
      childItems: [
        {
          name: "Элемент1",
          dataPath: "Элемент1",
          itemType: "InputField",
        } as InputField,
        {
          name: "Элемент2",
          dataPath: "Элемент2",
          itemType: "InputField",
        } as InputField,
      ],
    },
    structured: {
      strings: ['="Заголовок группы" Группа Элемент1: ; Элемент2:'],
      toOneLineGroup: false,
    },
  },
  {
    name: "one-line group with empty title",
    element: {
      name: "Группа",
      itemType: "UsualGroup",
      group: "AlwaysHorizontal",
      showTitle: true,
      title: { items: { ru: "" } },
      childItems: [
        {
          name: "Элемент1",
          dataPath: "Элемент1",
          itemType: "InputField",
        } as InputField,
        {
          name: "Элемент2",
          dataPath: "Элемент2",
          itemType: "InputField",
        } as InputField,
      ],
    },
    structured: {
      strings: ['="" Группа Элемент1: ; Элемент2:'],
      toOneLineGroup: false,
    },
  },
  {
    name: "horizontal group",
    element: {
      name: "Группа",
      itemType: "UsualGroup",
      group: "AlwaysHorizontal",
      showTitle: false,
      childItems: [
        {
          name: "ВертикальнаяГруппа1",
          itemType: "UsualGroup",
          group: "Vertical",
          showTitle: false,
          childItems: [
            {
              name: "Элемент1",
              dataPath: "Элемент1",
              itemType: "InputField",
            } as InputField,
          ],
        },
        {
          name: "Элемент2",
          dataPath: "Элемент2",
          itemType: "InputField",
        } as InputField,
      ],
    },
    structured: {
      strings: [
        `=Группа
  +ВертикальнаяГруппа1
    Элемент1: 
  Элемент2: `,
      ],
      toOneLineGroup: false,
    },
  },
  {
    name: "horizontal (if possible) group",
    element: {
      name: "Группа",
      itemType: "UsualGroup",
      group: "HorizontalIfPossible",
      showTitle: false,
      childItems: [
        {
          name: "ВертикальнаяГруппа1",
          itemType: "UsualGroup",
          group: "Vertical",
          showTitle: false,
          childItems: [
            {
              name: "Элемент1",
              dataPath: "Элемент1",
              itemType: "InputField",
            } as InputField,
          ],
        },
        {
          name: "Элемент2",
          dataPath: "Элемент2",
          itemType: "InputField",
        } as InputField,
      ],
    },
    structured: {
      strings: [
        `-Группа
  +ВертикальнаяГруппа1
    Элемент1: 
  Элемент2: `,
      ],
      toOneLineGroup: false,
    },
  },
  {
    name: "one-line group (if possible) without title",
    element: {
      name: "Группа",
      group: "HorizontalIfPossible",
      itemType: "UsualGroup",
      showTitle: false,
      childItems: [
        {
          name: "Элемент1",
          dataPath: "Элемент1",
          itemType: "InputField",
        } as InputField,
        {
          name: "Элемент2",
          dataPath: "Элемент2",
          itemType: "InputField",
        } as InputField,
      ],
    },
    structured: {
      strings: ["-Группа Элемент1: ; Элемент2:"],
      toOneLineGroup: false,
    },
  },
  {
    name: "one-line group (if possible) with title",
    element: {
      name: "Группа",
      group: "HorizontalIfPossible",
      showTitle: true,
      itemType: "UsualGroup",
      title: { items: { ru: "Заголовок группы" } },
      childItems: [
        {
          name: "Элемент1",
          dataPath: "Элемент1",
          itemType: "InputField",
        } as InputField,
        {
          name: "Элемент2",
          dataPath: "Элемент2",
          itemType: "InputField",
        } as InputField,
      ],
    },
    structured: {
      strings: ['-"Заголовок группы" Группа Элемент1: ; Элемент2:'],
      toOneLineGroup: false,
    },
  },
  {
    name: "one-line group (if possible) with empty title",
    element: {
      name: "Группа",
      group: "HorizontalIfPossible",
      showTitle: true,
      itemType: "UsualGroup",
      title: { items: { ru: "" } },
      childItems: [
        {
          name: "Элемент1",
          dataPath: "Элемент1",
          itemType: "InputField",
        } as InputField,
        {
          name: "Элемент2",
          dataPath: "Элемент2",
          itemType: "InputField",
        } as InputField,
      ],
    },
    structured: {
      strings: ['-"" Группа Элемент1: ; Элемент2:'],
      toOneLineGroup: false,
    },
  },
  {
    name: "vertical group",
    element: {
      name: "Группа",
      group: "Vertical",
      title: { items: { ru: "Заголовок группы" } },
      itemType: "UsualGroup",
      showTitle: true,
      childItems: [
        {
          name: "Элемент1",
          dataPath: "Элемент1",
          itemType: "InputField",
        } as InputField,
        {
          name: "Элемент2",
          dataPath: "Элемент2",
          itemType: "InputField",
        } as InputField,
      ],
    },
    structured: {
      strings: [
        `+"Заголовок группы" Группа
  Элемент1: 
  Элемент2: `,
      ],
      toOneLineGroup: false,
    },
  },
  {
    name: "empty horizontal group",
    element: {
      name: "Группа",
      itemType: "UsualGroup",
      group: "AlwaysHorizontal",
      childItems: [],
      showTitle: false,
    },
    structured: {
      strings: ["=Группа"],
      toOneLineGroup: false,
    },
  },
  {
    name: "empty vertical group",
    element: {
      name: "Группа",
      itemType: "UsualGroup",
      group: "Vertical",
      childItems: [],
      showTitle: false,
    },
    structured: {
      strings: ["+Группа"],
      toOneLineGroup: false,
    },
  },
  {
    name: "empty horizontal (if possible) group",
    element: {
      name: "Группа",
      itemType: "UsualGroup",
      group: "HorizontalIfPossible",
      childItems: [],
      showTitle: false,
    },
    structured: {
      strings: ["-Группа"],
      toOneLineGroup: false,
    },
  },
]
