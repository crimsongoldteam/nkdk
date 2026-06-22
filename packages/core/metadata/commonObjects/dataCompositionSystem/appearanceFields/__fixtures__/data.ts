import type { Color } from "~/metadata/commonObjects/color/types"
import type { Font } from "~/metadata/commonObjects/font/types"
import type { I8nText } from "~/metadata/commonObjects/i8nText/types"
import type { MetadataTypedPrimitiveValue } from "~/metadata/commonObjects/metadataValue/types"
import type { PropertyRule } from "~/metadata/orchestration"
import type { SettingsParameterValue } from "../../parameterValue/types"
import type { AppearanceFields, AppearanceFieldsYAML } from "../types"

const colorRed: Color = { type: "WebColor", value: "Red" }
const colorBlue: Color = { type: "WebColor", value: "Blue" }
const fontExtraLarge: Font = { kind: "StyleItem", ref: "ExtraLargeTextFont" }
const i8nFormat: I8nText = { items: { ru: "ЧЦ=3; ЧДЦ=2" } }
const i8nText: I8nText = { items: { ru: "Текст" } }
const boolTrue: MetadataTypedPrimitiveValue = { type: "boolean", value: true }
const boolFalse: MetadataTypedPrimitiveValue = { type: "boolean", value: false }

const pv = (parameter: string, value: SettingsParameterValue["value"], use?: false): SettingsParameterValue => ({
  parameter,
  ...(use !== undefined ? { use } : {}),
  value,
})

export const fixtureAppearanceRule: PropertyRule = {
  type: "AppearanceFields",
}

export const fixtureAppearanceFields: AppearanceFields = {
  itemType: "AppearanceFields",
  ЦветФона: pv("ЦветФона", colorRed, false),
  ЦветТекста: pv("ЦветТекста", colorBlue),
  Шрифт: pv("Шрифт", fontExtraLarge),
  ГоризонтальноеПоложение: pv("ГоризонтальноеПоложение", "Center"),
  Формат: pv("Формат", i8nFormat),
  ВыделятьОтрицательные: pv("ВыделятьОтрицательные", boolTrue),
  ОтметкаНезаполненного: pv("ОтметкаНезаполненного", boolTrue),
  Текст: pv("Текст", i8nText),
  Видимость: pv("Видимость", boolFalse),
  Доступность: pv("Доступность", boolFalse),
  ТолькоПросмотр: pv("ТолькоПросмотр", boolTrue),
  Отображать: pv("Отображать", boolFalse),
}

export const fixtureAppearanceFieldsYAML: AppearanceFieldsYAML = {
  ЦветФона: {
    Использовать: "Ложь",
    Значение: "Красный",
  },
  ЦветТекста: { Значение: "Синий" },
  Шрифт: { Значение: { Вид: "ОченьКрупныйШрифтТекста" } },
  ГоризонтальноеПоложение: { Значение: "Центр" },
  Формат: { Тип: "МногоязычнаяСтрока", Значение: "ЧЦ=3; ЧДЦ=2" },
  ВыделятьОтрицательные: { Значение: "Истина" },
  ОтметкаНезаполненного: { Значение: "Истина" },
  Текст: { Тип: "МногоязычнаяСтрока", Значение: "Текст" },
  Видимость: { Значение: "Ложь" },
  Доступность: { Значение: "Ложь" },
  ТолькоПросмотр: { Значение: "Истина" },
  Отображать: { Значение: "Ложь" },
}

export const fixtureAppearanceFieldsMinimal: AppearanceFields = {
  itemType: "AppearanceFields",
  ЦветФона: pv("ЦветФона", colorRed, false),
}

export const fixtureAppearanceFieldsMinimalYAML: AppearanceFieldsYAML = {
  ЦветФона: {
    // Параметр: "ЦветФона",
    Использовать: "Ложь",
    Значение: "Красный",
  },
}
