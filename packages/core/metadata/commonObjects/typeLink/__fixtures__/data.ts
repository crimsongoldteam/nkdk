import type { TypeLink } from "../types"

export const catalogTabularAttributeTypeLink: TypeLink = {
  dataPath: "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит",
  linkItem: 1,
}

export const catalogTabularAttributeTypeLinkLinkItem0: TypeLink = {
  dataPath: "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит",
  linkItem: 0,
}

export const accountingRegisterStandardAttributeTypeLink: TypeLink = {
  dataPath: "AccountingRegister.Международный.StandardAttribute.Account",
  linkItem: 1,
}

export const dcsTypeLink: TypeLink = {
  dataPath: "Поле1",
  linkItem: 2,
}

export const typeLinkYamlCatalogWithoutLinkItem =
  "Справочник.КакойТоСправочник.ТабличнаяЧасть.КакаяТоТаблица.Реквизит.КакойТоРеквизит" as const

export const typeLinkYamlCatalogWithLinkItem =
  "Справочник.КакойТоСправочник.ТабличнаяЧасть.КакаяТоТаблица.Реквизит.КакойТоРеквизит(1)" as const
