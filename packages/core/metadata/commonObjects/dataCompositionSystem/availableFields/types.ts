import type { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import type { I8nText, I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import type * as SE from "~/metadata/systemEnumerations/types"

export type AvailableFieldItem =
  | string
  | {
      field: string
      use?: boolean
      title?: I8nText
      lwsTitle?: I8nText
      viewMode?: SE.DataCompositionSettingsItemViewMode
    }

export type AvailableFields = AvailableFieldItem[]

export type AvailableFieldItemYAML =
  | string
  | {
      Поле: string
      Использование?: StringboolYAML
      Заголовок?: I8nTextYAML
      ЗаголовокLWS?: I8nTextYAML
      РежимОтображения?: SE.DataCompositionSettingsItemViewModeYAML
    }

export type AvailableFieldsYAML = AvailableFieldItemYAML[]

export type AvailableFieldXML = {
  "dcsset:field": string | { "#text"?: string }
  "dcsset:use"?: boolean | string
  "dcsset:title"?: I8nTextXML
  "dcsset:lwsTitle"?: I8nTextXML
  "dcsset:viewMode"?: SE.DataCompositionSettingsItemViewMode
}

export type AvailableFieldsXML = {
  "dcsset:item"?: AvailableFieldXML | AvailableFieldXML[]
}
