import { Pages, PagesEnterprise, PagesPartialYAML, PagesTypedYAML } from "~/metadata/forms/elements/pages/types"
import {
  fullFormGroupCommonFixture,
  fullFormGroupEnterpriseCommonFixture,
  fullFormGroupPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formGroup/__fixtures__/data"

export const fullPages: Pages = {
  itemType: "Pages",
  name: "Страницы",
  ...fullFormGroupCommonFixture,
  shortcut: "S",
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
  verticalAlignInGroup: "Center",
  displayImportance: "VeryHigh",
  currentRowUse: "Use",
  pagesRepresentation: "TabsOnTop",
  table: "Таблица",
  events: {
    onCurrentPageChange: "ПриСменеСтраницы",
  },
  childItems: [
    {
      itemType: "Page",
      name: "СтраницаМинимальная",
      childItems: [],
    },
  ],
}

export const fullPagesEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_Страницы",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.Pages" },
  ChildItems: [
    {
      ChildItems: [],
      ElementType: "FormGroup",
      Name: "prefix_СтраницаМинимальная",
      Type: { Type: "SystemEnumeration", Value: "FormGroupType.Page" },
    },
  ],
  CurrentRowUse: {
    Type: "SystemEnumeration",
    Value: "CurrentRowUse.Use",
  },
  DisplayImportance: {
    Type: "SystemEnumeration",
    Value: "DisplayImportance.VeryHigh",
  },
  PagesRepresentation: {
    Type: "SystemEnumeration",
    Value: "FormPagesRepresentation.TabsOnTop",
  },
  Title: "Заголовок элемента",
  ...fullFormGroupEnterpriseCommonFixture,
  VerticalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Center",
  },
} satisfies Required<Omit<PagesEnterprise, "CurrentPagesState">>

export const fullPagesSource: Pages = {
  itemType: "Pages",
  name: "Страницы",
  title: { items: { ru: "Страницы" } },
  childItems: [],
}

export const fullPagesPartialYAML: PagesPartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixture,
  СочетаниеКлавиш: "S",
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  ВажностьПриОтображении: "ОченьВысокая",
  ВертикальноеПоложениеВГруппе: "Центр",
  ИспользованиеТекущейСтроки: "Использует",
  ОтображениеСтраниц: "ЗакладкиСверху",
  Таблица: "Таблица",
  События: {
    ПриСменеСтраницы: "ПриСменеСтраницы",
  },
}

export const fullPagesTypedYAML: PagesTypedYAML = {
  ...fullPagesPartialYAML,
  Тип: "Страницы",
  Заголовок: "Заголовок элемента",
}

export const minimalPages: Pages = {
  itemType: "Pages",
  name: "Страницы",
  childItems: [],
}

export const minimalPagesPartialYAML: PagesPartialYAML = {}

export const minimalPagesTypedYAML: PagesTypedYAML = {
  Тип: "Страницы",
}
