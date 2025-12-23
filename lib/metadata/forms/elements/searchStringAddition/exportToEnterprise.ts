import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormItemAdditionToEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/exportToEnterprise"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
} from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportSearchStringAdditionToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: SearchStringAddition | undefined
): SearchStringAdditionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToEnterprise(configurationSettings, data)!,

    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЦветТекста: exportColorToEnterprise(configurationSettings, data.textColor),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(configurationSettings, data.font),
  })
}

registerMetadata("ExportToEnterprise", "SearchStringAddition", exportSearchStringAdditionToEnterprise)
