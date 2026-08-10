import { InputField } from "../../inputField/types"
import { UsualGroup, UsualGroupEnterprise, UsualGroupPartialYAML, UsualGroupTypedYAML } from "../types"

import { StructureResult } from "../../../../../tests/types"
import { RequiredFieldsElement } from "../../../../../tests/types"
import {
  fullFormGroupCommonFixture,
  fullFormGroupEnterpriseCommonFixture,
  fullFormGroupPartialYAMLCommonFixture,
} from "../../formGroup/__fixtures__/data"

export const fullUsualGroup: RequiredFieldsElement<UsualGroup> = {
  itemType: "UsualGroup",
  name: "ОбычнаяГруппа",
  ...fullFormGroupCommonFixture,
  shortcut: "S",
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
  showTitle: false,
  backColor: { type: "WebColor", value: "MediumOrchid" },
  behavior: "Collapsible",
  childItemsHorizontalAlign: "Right",
  childItemsVerticalAlign: "Bottom",
  collapsed: true,
  collapsedRepresentationTitle: {
    items: { ru: "Заголовок свернутого отображения" },
  },
  controlRepresentation: "Picture",
  currentRowUse: "Use",
  displayImportance: "VeryHigh",
  format: {
    items: { ru: "ЧЦ=3; ДФ=" },
  },
  group: "AlwaysHorizontal",
  hiddenRepresentationTitleBackColor: { type: "WebColor", value: "Green" },
  horizontalSpacing: "OneAndHalf",
  itemsAndTitlesAlign: "ItemsLeftTitlesLeft",
  representation: "StrongSeparation",
  slaveItemsWidth: "Equal",
  showLeftMargin: false,
  throughAlign: "Use",
  titleDataPath: "Реквизит1",
  united: false,
  verticalSpacing: "Double",
  table: { type: "string" as const, value: "Таблица" },
  childItems: [
    {
      itemType: "UsualGroup",
      name: "Группа1",
      group: "HorizontalIfPossible",
      showTitle: true,
      childItems: [],
    },
  ],
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
  Omit<UsualGroupPartialYAML, "Заголовок" | "Использование" | "РазрешитьИзменениеСостава" | "РастягиватьПоВертикали">
> = {
  ...fullFormGroupPartialYAMLCommonFixture,
  СочетаниеКлавиш: "S",
  РасширеннаяПодсказка: { Заголовок: { Текст: "Расширенная подсказка" } },
  ВажностьПриОтображении: "ОченьВысокая",
  ВертикальноеПоложениеПодчиненных: "Низ",
  ВертикальныйИнтервал: "Двойной",
  ВыравниваниеЭлементовИЗаголовков: "ЭлементыЛевоЗаголовкиЛево",
  ГоризонтальноеПоложениеПодчиненных: "Право",
  ГоризонтальныйИнтервал: "Полуторный",
  Группировка: "ГоризонтальнаяВсегда",
  ЗаголовокСвернутогоОтображения: "Заголовок свернутого отображения",
  ИспользованиеТекущейСтроки: "Использует",
  Объединенная: "Ложь",
  ОтображатьЗаголовок: "Ложь",
  ОтображатьОтступСлева: "Ложь",
  Отображение: "СильноеВыделение",
  ОтображениеУправления: "Картинка",
  ШиринаПодчиненныхЭлементов: "Одинаковая",
  Поведение: "Свертываемая",
  ПутьКДаннымЗаголовка: "Реквизит1",
  СквозноеВыравнивание: "Использовать",
  Свернута: "Истина",
  Формат: "ЧЦ=3; ДФ=",
  ЦветФона: "ОрхидеяНейтральный",
  ЦветФонаЗаголовкаСкрытогоОтображения: "Зеленый",
  Таблица: "Таблица",
  Элементы: {
    Группа1: {
      Вид: "Группа",
    },
  },
}

export const fullUsualGroupTypedYAML: UsualGroupTypedYAML = {
  ...fullUsualGroupPartialYAML,
  Тип: "Группа",
  Заголовок: "Заголовок элемента",
}

export const fullUsualGroupEnterprise = {
  BackColor: { Type: "Color", Value: "WebColors.MediumOrchid" },
  Behavior: { Type: "SystemEnumeration", Value: "UsualGroupBehavior.Collapsible" },
  ChildItemsHorizontalAlign: { Type: "SystemEnumeration", Value: "ItemHorizontalLocation.Right" },
  ChildItemsVerticalAlign: { Type: "SystemEnumeration", Value: "ItemVerticalAlign.Bottom" },
  Collapsed: true,
  CollapsedRepresentationTitle: "Заголовок свернутого отображения",
  ControlRepresentation: { Type: "SystemEnumeration", Value: "UsualGroupControlRepresentation.Picture" },
  CurrentRowUse: { Type: "SystemEnumeration", Value: "CurrentRowUse.Use" },
  DisplayImportance: { Type: "SystemEnumeration", Value: "DisplayImportance.VeryHigh" },
  ElementType: "FormGroup",
  Format: "ЧЦ=3; ДФ=",
  Group: { Type: "SystemEnumeration", Value: "ChildFormItemsGroup.AlwaysHorizontal" },
  HiddenRepresentationTitleBackColor: { Type: "Color", Value: "WebColors.Green" },
  HorizontalSpacing: { Type: "SystemEnumeration", Value: "FormItemSpacing.OneAndHalf" },
  ItemsAndTitlesAlign: { Type: "SystemEnumeration", Value: "ItemsAndTitlesAlignVariant.ItemsLeftTitlesLeft" },
  Name: "prefix_ОбычнаяГруппа",
  Representation: { Type: "SystemEnumeration", Value: "UsualGroupRepresentation.StrongSeparation" },
  SlaveItemsWidth: { Type: "SystemEnumeration", Value: "ChildFormItemsWidth.Equal" },
  ShowLeftMargin: false,
  ShowTitle: false,
  ThroughAlign: { Type: "SystemEnumeration", Value: "ThroughAlign.Use" },
  Title: "Заголовок элемента",
  TitleDataPath: "prefix_Реквизит1",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.UsualGroup" },
  United: false,
  VerticalSpacing: { Type: "SystemEnumeration", Value: "FormItemSpacing.Double" },
  ChildItems: [
    {
      ChildItems: [],
      ElementType: "FormGroup",
      Group: { Type: "SystemEnumeration", Value: "ChildFormItemsGroup.HorizontalIfPossible" },
      Name: "prefix_Группа1",
      ShowTitle: true,
      Type: { Type: "SystemEnumeration", Value: "FormGroupType.UsualGroup" },
    },
  ],
  ...fullFormGroupEnterpriseCommonFixture,
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
  structured: StructureResult
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
    name: "vertical group with addition elements",
    element: {
      name: "Группа",
      itemType: "UsualGroup",
      group: "Vertical",
      showTitle: false,
      childItems: [
        {
          name: "СтрокаПоиска",
          itemType: "SearchStringAddition",
        },
        {
          name: "УправлениеПоиском",
          itemType: "SearchControlAddition",
          childItems: [],
        },
        {
          name: "СостояниеПросмотра",
          itemType: "ViewStatusAddition",
        },
      ],
    },
    structured: {
      strings: [
        `+Группа
  ?ОтображениеСтрокиПоиска СтрокаПоиска
  ?УправлениеПоиском УправлениеПоиском
  ?ОтображениеСостоянияПросмотра СостояниеПросмотра`,
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
