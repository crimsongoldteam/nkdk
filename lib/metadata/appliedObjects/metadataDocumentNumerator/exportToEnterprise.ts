import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorEnterprise,
} from "~/lib/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataDocumentNumeratorToEnterprise = (
  data: MetadataDocumentNumerator | undefined,
  configurationSettings: ConfigurationSettings
): MetadataDocumentNumeratorEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ДлинаНомера: data.numberLength,
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(
      data.numberAllowedLength,
      SE.AllowedLengthToEnterprise,
      configurationSettings
    ),
    Имя: data.name,
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(data.checkUnique, configurationSettings),
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise,
      configurationSettings
    ),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    Синоним: exportI8nTextToEnterprise(data.synonym, configurationSettings),
    ТипНомера: exportSystemEnumerationToEnterprise(
      data.numberType,
      SE.DocumentNumberTypeToEnterprise,
      configurationSettings
    ),
  })
}
