import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorEnterprise,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataDocumentNumeratorToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataDocumentNumerator | undefined
): MetadataDocumentNumeratorEnterprise | undefined => {
  if (!data) return undefined

  return {
    ДлинаНомера: data.numberLength,
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.numberAllowedLength,
      SE.AllowedLengthToEnterprise
    ),
    Имя: data.name,
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(context, undefined, data.checkUnique),
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise
    ),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    Синоним: exportI8nTextToEnterprise(context, undefined, data.synonym),
    ТипНомера: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.numberType,
      SE.DocumentNumberTypeToEnterprise
    ),
  }
}
