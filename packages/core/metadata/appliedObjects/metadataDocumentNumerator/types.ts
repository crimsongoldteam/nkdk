import { StringboolEnterprise } from "~/packages/core/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/packages/core/metadata/commonObjects/i8nText/types"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export interface MetadataDocumentNumerator {
  checkUnique?: boolean
  comment?: string
  name?: string
  numberAllowedLength?: SE.AllowedLength
  numberLength?: number
  numberPeriodicity?: SE.BusinessProcessNumberPeriodicity
  numberType?: SE.DocumentNumberType
  objectBelonging?: SE.ObjectBelonging
  synonym?: I8nText
}

export interface MetadataDocumentNumeratorXML {
  CheckUnique?: boolean
  Comment?: string
  Name?: string
  NumberAllowedLength?: SE.AllowedLength
  NumberLength?: number
  NumberPeriodicity?: SE.BusinessProcessNumberPeriodicity
  NumberType?: SE.DocumentNumberType
  ObjectBelonging?: SE.ObjectBelonging
  Synonym?: I8nTextXML
}

export interface MetadataDocumentNumeratorEnterprise {
  ДлинаНомера?: number
  ДопустимаяДлинаНомера?: SE.AllowedLengthEnterprise
  Имя?: string
  Комментарий?: string
  КонтрольУникальности?: StringboolEnterprise
  ПериодичностьНомера?: SE.BusinessProcessNumberPeriodicityEnterprise
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  Синоним?: I8nTextEnterprise
  ТипНомера?: SE.DocumentNumberTypeEnterprise
}
