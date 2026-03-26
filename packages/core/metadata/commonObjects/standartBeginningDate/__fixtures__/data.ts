import type {
  StandartBeginningDate,
  StandartBeginningDateXML,
  StandartBeginningDateYAML,
} from "../types"

export const fullStandartBeginningDate = {
  variant: "Custom",
  date: "0001-01-01T00:00:00",
} satisfies Required<StandartBeginningDate>

export const fullStandartBeginningDateYAML = {
  Вариант: "ПроизвольнаяДата",
  Дата: "01.01.0001 00:00:00",
} satisfies Required<StandartBeginningDateYAML>

export const fullStandartBeginningDateXML = {
  "_xsi:type": "v8:StandardBeginningDate",
  "v8:variant": {
    "_xsi:type": "v8:StandardBeginningDateVariant",
    "#text": "Custom",
  },
  "v8:date": "0001-01-01T00:00:00",
} satisfies Required<StandartBeginningDateXML>
