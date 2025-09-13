import { BaseElementCtor, IBaseElement } from "@/elements/interfaces"
import { TableElement } from "@/elements/tableElement"

export class SeparatorsMap {
  private static readonly separators: Array<[BaseElementCtor | undefined, BaseElementCtor | undefined]> = []

  /**
   * Регистрирует необходимость разделителя между элементами
   * @param elementClass - класс текущего элемента (может быть undefined)
   * @param previousElementClass - класс предыдущего элемента (может быть undefined)
   */
  public static register(
    elementClass: BaseElementCtor | undefined,
    previousElementClass: BaseElementCtor | undefined
  ): void {
    SeparatorsMap.separators.push([elementClass, previousElementClass])
  }

  /**
   * Проверяет, нужен ли разделитель между элементами
   * @param element - текущий элемент
   * @param previousElement - предыдущий элемент
   * @returns true, если нужен разделитель
   */
  public static isNeedSeparator(element: IBaseElement | undefined, previousElement: IBaseElement | undefined): boolean {
    if (!element || !previousElement) {
      return false
    }

    return (
      SeparatorsMap.separators.find(
        ([elementClass, previousElementClass]) =>
          (elementClass === undefined || element instanceof elementClass) &&
          (previousElementClass === undefined || previousElement instanceof previousElementClass)
      ) !== undefined
    )
  }
}

SeparatorsMap.register(TableElement, TableElement)
