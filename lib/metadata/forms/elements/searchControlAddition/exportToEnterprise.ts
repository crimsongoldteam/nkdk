import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormItemAdditionToEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/exportToEnterprise"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
} from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportSearchControlAdditionToEnterprise = (
  data: SearchControlAddition | undefined,
  configurationSettings: ConfigurationSettings
): SearchControlAdditionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "SearchControlAddition", exportSearchControlAdditionToEnterprise)
