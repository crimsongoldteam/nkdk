import * as t from "../../parser/lexer"
import { TypeDescription } from "@/elements/typeDescription"
import { DateFractions } from "@/elements/types"
import { IFormHorizontalAlignableStretchableProperties } from "@/meta/forms/interfaces"
import { format as fnsFormat } from "date-fns"
import * as SystemEnumeration from "@/meta/systemEnumerations"

export class FormatterUtils {
  public static formatValue(value: string | boolean | number | Date, typeDescription: TypeDescription): string {
    if (typeof value === "number") {
      return this.formatNumber(value, typeDescription)
    }

    if (value instanceof Date) {
      return this.formatDate(value, typeDescription)
    }

    return value.toString()
  }

  private static formatNumber(value: number, typeDescription: TypeDescription): string {
    return value.toFixed(typeDescription.fractionDigits)
  }

  private static formatDate(value: Date, typeDescription: TypeDescription): string {
    if (typeDescription.dateFractions == DateFractions.Date) {
      return fnsFormat(value, "dd.MM.yyyy")
    }

    if (typeDescription.dateFractions == DateFractions.Time) {
      return fnsFormat(value, "HH:mm:ss")
    }

    return fnsFormat(value, "dd.MM.yyyy HH:mm:ss")
  }

  public static getAlignmentAtLeft(properties: IFormHorizontalAlignableStretchableProperties): string {
    if (
      properties.horizontalAlignInGroup == SystemEnumeration.HorizontalAlign.Center ||
      properties.horizontalAlignInGroup == SystemEnumeration.HorizontalAlign.Right
    ) {
      return t.RArrow.LABEL + " "
    }

    return ""
  }

  public static getAlignmentAtRight(properties: IFormHorizontalAlignableStretchableProperties): string {
    if (properties.horizontalAlignInGroup == SystemEnumeration.HorizontalAlign.Center) {
      return " " + t.LArrow.LABEL
    }

    if (properties.horizontalStretch) {
      return " " + t.RArrow.LABEL
    }

    return ""
  }

  public static excludeStretchProperties(
    excludeProperties: string[],
    element: IFormHorizontalAlignableStretchableProperties
  ): void {
    if (!element.horizontalStretch) return

    excludeProperties.push("РастягиватьПоГоризонтали")
  }

  public static getCheckboxString(
    text: string,
    hasCheckbox: boolean,
    checkboxType: string = "Флажок",
    checkboxValue: boolean = false,
    captionPosition: string = "Лево"
  ): string {
    if (!hasCheckbox) {
      return text
    }

    let value = ""

    if (checkboxType === "Выключатель") {
      value = checkboxValue ? " |1" : "0| "
    } else {
      value = checkboxValue ? "X" : " "
    }

    const checkbox = `[${value}]`

    if (!text) {
      return checkbox
    }

    return captionPosition === "Право" ? `${checkbox} ${text}` : `${text} ${checkbox}`
  }

  public static getRadioButtonItemString(text: string, radioButtonValue: boolean = false): string {
    const value = radioButtonValue ? "X" : " "
    const radioButton = `(${value})`

    if (!text) {
      return radioButton
    }

    return `${radioButton}${text}`
  }

  public static distributeNumberWithAlignment(numberToDistribute: number, valuesArray: number[]): number[] {
    const resultArray: number[] = []

    const sum = valuesArray.reduce((acc, val) => acc + val, 0)

    if (sum >= numberToDistribute) {
      return [...valuesArray]
    }

    const average = Math.floor(numberToDistribute / valuesArray.length)

    // Разделяем индексы на "максимальные" и "минимальные" значения
    const maxIndexes: number[] = []
    const minIndexes: number[] = []

    valuesArray.forEach((value, index) => {
      if (value >= average) {
        maxIndexes.push(index)
        resultArray[index] = value
      } else {
        minIndexes.push(index)
        resultArray[index] = 0
      }
    })

    // Распределяем остаток на "минимальные" значения
    let remainder = numberToDistribute - maxIndexes.reduce((acc, idx) => acc + valuesArray[idx], 0)
    const minValuesCount = minIndexes.length

    if (minValuesCount === 0) {
      return resultArray
    }

    const share = Math.floor(remainder / minValuesCount)

    minIndexes.forEach((index, i) => {
      // Последний элемент получает весь остаток
      const value = i === minIndexes.length - 1 ? share + (remainder - share * minValuesCount) : share

      resultArray[index] = value
    })

    return resultArray
  }
}
