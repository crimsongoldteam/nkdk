import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorEnterprise,
} from "~/lib/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataDocumentNumeratorToEnterprise = (
  data: MetadataDocumentNumerator | undefined
): MetadataDocumentNumeratorEnterprise | undefined => {
  if (!data) return undefined

  return {
    КонтрольУникальности: exportBooleanToEnterprise(data.checkUnique),
    Комментарий: data.comment,
    Имя: data.name,
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(data.numberAllowedLength, SE.AllowedLengthToEnterprise),
    ДлинаНомера: data.numberLength,
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise
    ),
    ТипНомера: exportSystemEnumerationToEnterprise(data.numberType, SE.DocumentNumberTypeToEnterprise),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(data.objectBelonging, SE.ObjectBelongingToEnterprise),
    Синоним: exportI8nTextToEnterprise(data.synonym),
  }
}
