import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import * as SE from "~/metadata/systemEnumerations/types"

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

export interface MetadataDocumentNumeratorYAML {
  ДлинаНомера?: number
  ДопустимаяДлинаНомера?: SE.AllowedLengthYAML
  Имя?: string
  Комментарий?: string
  КонтрольУникальности?: StringboolYAML
  ПериодичностьНомера?: SE.BusinessProcessNumberPeriodicityYAML
  ПринадлежностьОбъекта?: SE.ObjectBelongingYAML
  Синоним?: I8nTextYAML
  ТипНомера?: SE.DocumentNumberTypeYAML
}
