import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupPartialEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import { Table, TablePartialEnterprise, TableXML } from "~/metadata/forms/elements/table/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { Page, PageXML } from "../page/types"

export interface Pages extends FormGroup {
  elementType: "Pages"
  associatedTable?: Table
  currentPagesState?: SE.FormPagesState
  currentRowUse?: SE.CurrentRowUse
  pagesRepresentation?: SE.FormPagesRepresentation
  userVisible?: UserVisible
  events?: {
    onCurrentPageChange?: string
  }
  childItems: Page[]
}

export interface PagesXML extends FormGroupXML {
  AssociatedTable?: TableXML
  CurrentPagesState?: SE.FormPagesState
  CurrentRowUse?: SE.CurrentRowUse
  PagesRepresentation?: SE.FormPagesRepresentation
  UserVisible?: UserVisibleXML
  Events?: EventsXML
  ChildItems?: PageXML[]
}

export interface PagesPartialEnterprise extends FormGroupPartialEnterprise {
  ИспользованиеТекущейСтроки?: SE.CurrentRowUseEnterprise
  ИспользуемаяТаблица?: TablePartialEnterprise
  ОтображениеСтраниц?: SE.FormPagesRepresentationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ТекущееСостояниеСтраниц?: SE.FormPagesStateEnterprise
  События?: {
    ПриСменеСтраницы?: string
  }
}

export interface PagesTypedEnterprise extends PagesPartialEnterprise {
  Тип: "Страницы"
}

/**
 * @deprecated Use PagesPartialEnterprise or PagesTypedEnterprise instead
 */
export type PagesEnterprise = PagesPartialEnterprise
