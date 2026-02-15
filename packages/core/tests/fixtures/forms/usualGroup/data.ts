import { InputField } from "~/metadata/forms/elements/inputField/types"
import {
  UsualGroup,
  UsualGroupPartialEnterprise,
  UsualGroupPreview,
  UsualGroupTypedEnterprise,
} from "~/metadata/forms/elements/usualGroup/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

export const fullUsualGroup: Required<UsualGroup> = {
  itemType: CollectionFormElementType.UsualGroup,
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
  childItems: [],
}

export const fullUsualGroupSource: UsualGroup = {
  itemType: CollectionFormElementType.UsualGroup,
  name: "ОбычнаяГруппа",
  title: { items: { ru: "Обычная группа" } },
  childItems: [],
}

export const fullUsualGroupPartialEnterprise: Required<
  Omit<UsualGroupPartialEnterprise, "Заголовок" | "ЗапретитьИспользование">
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
  Группировка: "Вертикальная",
  ЗаголовокСвернутогоОтображения: "Заголовок свернутого отображения",
  ИспользованиеТекущейСтроки: "НеИспользует",
  Объединенная: "Ложь",
  ОтображатьЗаголовок: "Ложь",
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

export const fullUsualGroupTypedEnterprise: UsualGroupTypedEnterprise = {
  ...fullUsualGroupPartialEnterprise,
  Тип: "Группа",
  Заголовок: "Обычная группа",
}

export const fullUsualGroupPreview: Required<UsualGroupPreview> = {
  itemType: "FormGroup",
  Name: "ОбычнаяГруппа",
  BackColor: { Type: "Color", Value: "WebColors.White" },
  Behavior: { Type: "SystemEnumeration", Value: "UsualGroupBehavior.Collapsible" },
  Collapsed: true,
  CollapsedRepresentationTitle: "Заголовок свернутого отображения",
  ControlRepresentation: { Type: "SystemEnumeration", Value: "UsualGroupControlRepresentation.Picture" },
  CurrentRowUse: { Type: "SystemEnumeration", Value: "CurrentRowUse.DontUse" },
  DisplayImportance: { Type: "SystemEnumeration", Value: "DisplayImportance.High" },
  EnableContentChange: true,
  Enabled: false,
  Format: "БЛ=Выключено",
  Group: { Type: "SystemEnumeration", Value: "ChildFormItemsGroup.Vertical" },
  Height: 200,
  HiddenRepresentationTitleBackColor: { Type: "Color", Value: "WebColors.Gold" },
  HorizontalAlign: { Type: "SystemEnumeration", Value: "HorizontalAlign.Left" },
  HorizontalSpacing: { Type: "SystemEnumeration", Value: "FormItemSpacing.Single" },
  HorizontalStretch: true,
  ItemsAndTitlesAlign: { Type: "SystemEnumeration", Value: "ItemsAndTitlesAlignVariant.ItemsLeftTitlesLeft" },
  ReadOnly: true,
  Representation: { Type: "SystemEnumeration", Value: "UsualGroupRepresentation.NormalSeparation" },
  ShowLeftMargin: false,
  ShowTitle: false,
  ThroughAlign: { Type: "SystemEnumeration", Value: "ThroughAlign.DontUse" },
  Title: "Обычная группа",
  TitleDataPath: "ТекстовыйРеквизит",
  TitleFont: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  TitleTextColor: { Type: "Color", Value: "WebColors.Black" },
  ToolTip: "Подсказка",
  ToolTipRepresentation: { Type: "SystemEnumeration", Value: "ToolTipRepresentation.None" },
  United: false,
  VerticalAlign: { Type: "SystemEnumeration", Value: "VerticalAlign.Top" },
  VerticalSpacing: { Type: "SystemEnumeration", Value: "FormItemSpacing.Single" },
  VerticalStretch: true,
  Visible: false,
  Width: 300,
  ChildItems: [],
}

export const minimalUsualGroup: UsualGroup = {
  itemType: CollectionFormElementType.UsualGroup,
  name: "ОбычнаяГруппа",
  childItems: [],
}

export const minimalUsualGroupPartialEnterprise: UsualGroupPartialEnterprise = {}

export const minimalUsualGroupTypedEnterprise: UsualGroupTypedEnterprise = {
  Тип: "Группа",
}

export interface StructureFixture<T> {
  name: string
  element: T
  structured: string
}

export type StructureFixturesTable<T> = StructureFixture<T>[]

export const usualGroupStructureFixtures: StructureFixturesTable<UsualGroup> = [
  {
    name: "one-line group without title",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      group: "Horizontal",
      showTitle: false,
      childItems: [
        {
          name: "Элемент1",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%{Группа}% {Элемент1}: ; {Элемент2}: `,
  },
  {
    name: "one-line group with title",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      group: "Horizontal",
      title: { items: { ru: "Заголовок группы" } },
      childItems: [
        {
          name: "Элемент1",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%Заголовок группы {Группа}% {Элемент1}: ; {Элемент2}: `,
  },
  {
    name: "one-line group with empty title",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      group: "Horizontal",
      title: { items: { ru: "" } },
      childItems: [
        {
          name: "Элемент1",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%"" {Группа}% {Элемент1}: ; {Элемент2}: `,
  },
  {
    name: "horizontal group",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      group: "Horizontal",
      childItems: [
        {
          name: "ВертикальнаяГруппа1",
          itemType: CollectionFormElementType.UsualGroup,
          group: "Vertical",
          childItems: [
            {
              name: "Элемент1",
              itemType: CollectionFormElementType.InputField,
            } as InputField,
          ],
        } as UsualGroup,
        {
          name: "Элемент2",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%{Группа}
  #{ВертикальнаяГруппа1}
    {Элемент1}: 
  {Элемент2}: `,
  },
  {
    name: "horizontal (if possible) group",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      childItems: [
        {
          name: "ВертикальнаяГруппа1",
          itemType: CollectionFormElementType.UsualGroup,
          group: "Vertical",
          childItems: [
            {
              name: "Элемент1",
              itemType: CollectionFormElementType.InputField,
            } as InputField,
          ],
        } as UsualGroup,
        {
          name: "Элемент2",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%#{Группа}
  #{ВертикальнаяГруппа1}
    {Элемент1}: 
  {Элемент2}: `,
  },
  {
    name: "one-line group (if possible) without title",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      showTitle: false,
      childItems: [
        {
          name: "Элемент1",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%#{Группа}% {Элемент1}: ; {Элемент2}: `,
  },
  {
    name: "one-line group (if possible) with title",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      title: { items: { ru: "Заголовок группы" } },
      childItems: [
        {
          name: "Элемент1",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%#Заголовок группы {Группа}% {Элемент1}: ; {Элемент2}: `,
  },
  {
    name: "one-line group (if possible) with empty title",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      title: { items: { ru: "" } },
      childItems: [
        {
          name: "Элемент1",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%#"" {Группа}% {Элемент1}: ; {Элемент2}: `,
  },
  {
    name: "vertical group",
    element: {
      name: "Группа",
      group: "Vertical",
      title: { items: { ru: "Заголовок группы" } },
      itemType: CollectionFormElementType.UsualGroup,
      childItems: [
        {
          name: "Элемент1",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `#Заголовок группы {Группа}
  {Элемент1}: 
  {Элемент2}: `,
  },
  {
    name: "empty horizontal group",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      group: "Horizontal",
      childItems: [],
    } as UsualGroup,
    structured: `%{Группа}`,
  },
  {
    name: "empty vertical group",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      group: "Vertical",
      childItems: [],
    } as UsualGroup,
    structured: `#{Группа}`,
  },
  {
    name: "empty horizontal (if possible) group",
    element: {
      name: "Группа",
      itemType: CollectionFormElementType.UsualGroup,
      childItems: [],
    } as UsualGroup,
    structured: `%#{Группа}`,
  },
]
