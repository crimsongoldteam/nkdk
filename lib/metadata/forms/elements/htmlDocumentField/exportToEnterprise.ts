import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { HTMLDocumentField, HTMLDocumentFieldEnterprise } from "~/lib/metadata/forms/elements/htmlDocumentField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportHTMLDocumentFieldToEnterprise = (
  configurationSettings: ConfigurationSettings, data: HTMLDocumentField | undefined
): HTMLDocumentFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(configurationSettings, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(configurationSettings, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    Вывод: exportSystemEnumerationToEnterprise(configurationSettings, data.output, SE.UseOutputToEnterprise),
    Высота: data.height,
    ИнформацияПрограммыПросмотра: data.userAgentInformation,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    Ширина: data.width,
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "HTMLDocumentField", exportHTMLDocumentFieldToEnterprise)
