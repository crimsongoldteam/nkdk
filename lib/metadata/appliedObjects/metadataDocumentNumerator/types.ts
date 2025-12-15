import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
  КонтрольУникальности?: StringboolEnterprise
  Комментарий?: string
  Имя?: string
  ДопустимаяДлинаНомера?: SE.AllowedLengthEnterprise
  ДлинаНомера?: number
  ПериодичностьНомера?: SE.BusinessProcessNumberPeriodicityEnterprise
  ТипНомера?: SE.DocumentNumberTypeEnterprise
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  Синоним?: I8nTextEnterprise
}
