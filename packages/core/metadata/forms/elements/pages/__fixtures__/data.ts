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
  title: {
    items: { ru: "Страницы" },
  },
  currentPagesState: "Titles",
  currentRowUse: "DontUse",
  pagesRepresentation: "Auto",
  events: {
    onCurrentPageChange: "ПроцедураПриСменеСтраницы",
  },
  childItems: [],
}

export const fullPagesEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_Страницы",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.Pages" },
  ChildItems: [],
  CurrentPagesState: {
    Type: "SystemEnumeration",
    Value: "FormPagesState.Titles",
  },
  CurrentRowUse: {
    Type: "SystemEnumeration",
    Value: "CurrentRowUse.DontUse",
  },
  PagesRepresentation: {
    Type: "SystemEnumeration",
    Value: "FormPagesRepresentation.Auto",
  },
  Title: "Страницы",
  ...fullFormGroupEnterpriseCommonFixture,
} satisfies Required<PagesEnterprise>

export const fullPagesSource: Pages = {
  itemType: "Pages",
  name: "Страницы",
  title: { items: { ru: "Страницы" } },
  childItems: [],
}

export const fullPagesPartialYAML: PagesPartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixture,
  ИспользованиеТекущейСтроки: "НеИспользует",
  ОтображениеСтраниц: "Авто",
  ТекущееСостояниеСтраниц: "Заголовки",
  События: {
    ПриСменеСтраницы: "ПроцедураПриСменеСтраницы",
  },
}

export const fullPagesTypedYAML: PagesTypedYAML = {
  ...fullPagesPartialYAML,
  Тип: "Страницы",
  Заголовок: "Страницы",
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
