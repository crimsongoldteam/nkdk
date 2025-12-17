import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorEnterprise,
} from "~/lib/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataDocumentNumeratorToEnterprise = (
  data: MetadataDocumentNumerator | undefined,
  configurationSettings: ConfigurationSettings
): MetadataDocumentNumeratorEnterprise | undefined => {
  if (!data) return undefined

  return {
    КонтрольУникальности: exportBooleanToEnterprise(data.checkUnique, configurationSettings),
    Комментарий: data.comment,
    Имя: data.name,
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(
      data.numberAllowedLength,
      SE.AllowedLengthToEnterprise,
      configurationSettings
    ),
    ДлинаНомера: data.numberLength,
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise,
      configurationSettings
    ),
    ТипНомера: exportSystemEnumerationToEnterprise(
      data.numberType,
      SE.DocumentNumberTypeToEnterprise,
      configurationSettings
    ),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    Синоним: exportI8nTextToEnterprise(data.synonym, configurationSettings),
  }
}
