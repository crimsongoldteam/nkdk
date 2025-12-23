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
  context: Context,
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
