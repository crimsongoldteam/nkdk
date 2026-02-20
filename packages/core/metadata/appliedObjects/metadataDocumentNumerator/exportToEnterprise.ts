import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorEnterprise,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
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
    ДопустимаяДлинаНомера: exportSystemEnumerationToYAML<SE.AllowedLengthEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "AllowedLength" },
      data.numberAllowedLength
    ),
    Имя: data.name,
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(context, undefined, data.checkUnique),
    ПериодичностьНомера: exportSystemEnumerationToYAML<SE.BusinessProcessNumberPeriodicityEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "BusinessProcessNumberPeriodicity" },
      data.numberPeriodicity
    ),
    ПринадлежностьОбъекта: exportSystemEnumerationToYAML<SE.ObjectBelongingEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
      data.objectBelonging
    ),
    Синоним: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.synonym }),
    ТипНомера: exportSystemEnumerationToYAML<SE.DocumentNumberTypeEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "DocumentNumberType" },
      data.numberType
    ),
  }
}
