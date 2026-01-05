import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorEnterprise,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataDocumentNumeratorToEnterprise = (
  context: ConfigurationContext,
  data: MetadataDocumentNumerator | undefined
): MetadataDocumentNumeratorEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ДлинаНомера: data.numberLength,
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(
      context,
      data.numberAllowedLength,
      SE.AllowedLengthToEnterprise
    ),
    Имя: data.name,
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(context, data.checkUnique),
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(
      context,
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise
    ),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      context,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    Синоним: exportI8nTextToEnterprise(context, data.synonym),
    ТипНомера: exportSystemEnumerationToEnterprise(context, data.numberType, SE.DocumentNumberTypeToEnterprise),
  })
}
