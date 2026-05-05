import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorYAML,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportSystemEnumerationToYAMLDeprecated } from "~/metadata/systemEnumerations/toYAML"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataDocumentNumeratorToYAML = (
  context: ConfigurationContext,
  data: MetadataDocumentNumerator | undefined
): MetadataDocumentNumeratorYAML | undefined => {
  if (!data) return undefined

  return {
    ДлинаНомера: data.numberLength,
    ДопустимаяДлинаНомера: exportSystemEnumerationToYAMLDeprecated<SE.AllowedLengthYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "AllowedLength" },
      data.numberAllowedLength
    ),
    Имя: data.name,
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToYAML(context, undefined, data.checkUnique),
    ПериодичностьНомера: exportSystemEnumerationToYAMLDeprecated<SE.BusinessProcessNumberPeriodicityYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "BusinessProcessNumberPeriodicity" },
      data.numberPeriodicity
    ),
    ПринадлежностьОбъекта: exportSystemEnumerationToYAMLDeprecated<SE.ObjectBelongingYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
      data.objectBelonging
    ),
    Синоним: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.synonym }),
    ТипНомера: exportSystemEnumerationToYAMLDeprecated<SE.DocumentNumberTypeYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "DocumentNumberType" },
      data.numberType
    ),
  }
}
