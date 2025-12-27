import {
  UserVisible,
  UserVisibleEnterprise,
  UserVisibleXML,
} from "~/packages/core/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/packages/core/metadata/forms/elements/formGroup/types"
import { Table, TableEnterprise, TableXML } from "~/packages/core/metadata/forms/elements/table/types"
import { EventsXML } from "~/packages/core/metadata/forms/events/types"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

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
  ИспользованиеТекущейСтроки?: SE.CurrentRowUseEnterprise
  ИспользуемаяТаблица?: TableEnterprise
  ОтображениеСтраниц?: SE.FormPagesRepresentationEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  ТекущееСостояниеСтраниц?: SE.FormPagesStateEnterprise
  События?: {
    ПриСменеСтраницы?: string
  }
}
