import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorEnterprise,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataDocumentNumeratorToEnterprise = (
  context: ConfigurationContext,
  data: MetadataDocumentNumerator | undefined
): MetadataDocumentNumeratorEnterprise | undefined => {
  if (!data) return undefined

  return {
    ДлинаНомера: data.numberLength,
    ДопустимаяДлинаНомера: exportSystemEnumerationToYAML(
      context,
      data.numberAllowedLength,
      SE.AllowedLengthToEnterprise
    ),
    Имя: data.name,
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(context, data.checkUnique),
    ПериодичностьНомера: exportSystemEnumerationToYAML(
      context,
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise
    ),
    ПринадлежностьОбъекта: exportSystemEnumerationToYAML(context, data.objectBelonging, SE.ObjectBelongingToEnterprise),
    Синоним: exportI8nTextToEnterprise(context, data.synonym),
    ТипНомера: exportSystemEnumerationToYAML(context, data.numberType, SE.DocumentNumberTypeToEnterprise),
  }
}
