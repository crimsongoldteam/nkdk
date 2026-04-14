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
import {
  fullFormGroupCommonFixture,
  fullFormGroupEnterpriseCommonFixture,
  fullFormGroupPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formGroup/__fixtures__/data"

export const fullUsualGroup: RequiredFieldsElement<UsualGroup> = {
  itemType: "UsualGroup",
  name: "ОбычнаяГруппа",
  ...fullFormGroupCommonFixture,
  showTitle: false,
  title: {
    items: { ru: "Обычная группа" },
  },
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
  Omit<
    UsualGroupPartialYAML,
    | "Заголовок"
    | "ЗапретитьИспользование"
    | "Группировка"
    | "ОтображатьЗаголовок"
    | "РазрешитьИзменениеСостава"
    | "РастягиватьПоВертикали"
  >
> = {
  ...fullFormGroupPartialYAMLCommonFixture,
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеПодчиненных: "Низ",
  ВертикальныйИнтервал: "Одинарный",
  ВыравниваниеЭлементовИЗаголовков: "ЭлементыЛевоЗаголовкиЛево",
  ГоризонтальноеПоложениеПодчиненных: "Центр",
  ГоризонтальныйИнтервал: "Одинарный",
  // Группировка: "Вертикальная", // toPartialYAML: false
  ЗаголовокСвернутогоОтображения: "Заголовок свернутого отображения",
  ИспользованиеТекущейСтроки: "НеИспользует",
  Объединенная: "Ложь",
  // ОтображатьЗаголовок: "Ложь", // toPartialYAML: false
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
  Format: "БЛ=Выключено",
  Group: { Type: "SystemEnumeration", Value: "ChildFormItemsGroup.Vertical" },
  HiddenRepresentationTitleBackColor: { Type: "Color", Value: "WebColors.Gold" },
  HorizontalSpacing: { Type: "SystemEnumeration", Value: "FormItemSpacing.Single" },
  ItemsAndTitlesAlign: { Type: "SystemEnumeration", Value: "ItemsAndTitlesAlignVariant.ItemsLeftTitlesLeft" },
  Name: "prefix_ОбычнаяГруппа",
  Representation: { Type: "SystemEnumeration", Value: "UsualGroupRepresentation.NormalSeparation" },
  ShowLeftMargin: false,
  ShowTitle: false,
  ThroughAlign: { Type: "SystemEnumeration", Value: "ThroughAlign.DontUse" },
  Title: "Обычная группа",
  TitleDataPath: "prefix_ТекстовыйРеквизит",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.UsualGroup" },
  United: false,
  VerticalSpacing: { Type: "SystemEnumeration", Value: "FormItemSpacing.Single" },
  ChildItems: [minimalInputFieldEnterprise],
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
