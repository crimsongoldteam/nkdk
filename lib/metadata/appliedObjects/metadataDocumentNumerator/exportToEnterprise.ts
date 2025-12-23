import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorEnterprise,
} from "~/lib/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataDocumentNumeratorToEnterprise = (
  configurationSettings: Context,
  data: MetadataDocumentNumerator | undefined
): MetadataDocumentNumeratorEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ДлинаНомера: data.numberLength,
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.numberAllowedLength,
      SE.AllowedLengthToEnterprise
    ),
    Имя: data.name,
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(configurationSettings, data.checkUnique),
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise
    ),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    Синоним: exportI8nTextToEnterprise(configurationSettings, data.synonym),
    ТипНомера: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.numberType,
      SE.DocumentNumberTypeToEnterprise
    ),
  })
}
