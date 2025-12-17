import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/lib/metadata/forms/elements/formGroup/types"
import { Table, TableEnterprise, TableXML } from "~/lib/metadata/forms/elements/table/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface Pages extends FormGroup {
  associatedTable?: Table
  currentPagesState?: SE.FormPagesState
  currentRowUse?: SE.CurrentRowUse
  pagesRepresentation?: SE.FormPagesRepresentation
  userVisible?: UserVisible
  events?: {
    onCurrentPageChange?: string
  }
}

export interface PagesXML extends FormGroupXML {
  AssociatedTable?: TableXML
  CurrentPagesState?: SE.FormPagesState
  CurrentRowUse?: SE.CurrentRowUse
  PagesRepresentation?: SE.FormPagesRepresentation
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface PagesEnterprise extends FormGroupEnterprise {
  ИспользуемаяТаблица?: TableEnterprise
  ТекущееСостояниеСтраниц?: SE.FormPagesStateEnterprise
  ИспользованиеТекущейСтроки?: SE.CurrentRowUseEnterprise
  ОтображениеСтраниц?: SE.FormPagesRepresentationEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  События?: {
    ПриСменеСтраницы?: string
  }
}
