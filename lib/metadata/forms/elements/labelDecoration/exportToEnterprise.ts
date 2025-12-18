import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { LabelDecoration, LabelDecorationEnterprise } from "~/lib/metadata/forms/elements/labelDecoration/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportLabelDecorationToEnterprise = (
  data: LabelDecoration | undefined,
  configurationSettings: ConfigurationSettings
): LabelDecorationEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormDecorationToEnterprise(data, configurationSettings)!,

    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    Рамка: exportBorderToEnterprise(data.border, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ВертикальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      data.groupVerticalAlign,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    Гиперссылка: exportBooleanToEnterprise(data.hyperlink, configurationSettings),
    ВысотаЗаголовка: data.titleHeight,
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(
      data.verticalAlign,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "LabelDecoration", exportLabelDecorationToEnterprise)
