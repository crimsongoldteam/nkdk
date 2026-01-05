// import { TElement } from "../metadata/forms/elements/element/types"

// export class SeparatorsMap {
//   private static readonly separators: Array<[TElement | undefined, TElement | undefined]> = []

//   /**
//    * Регистрирует необходимость разделителя между элементами
//    * @param elementClass - класс текущего элемента (может быть undefined)
//    * @param previousElementClass - класс предыдущего элемента (может быть undefined)
//    */
//   public static register(elementClass: TElement | undefined, previousElementClass: TElement | undefined): void {
//     SeparatorsMap.separators.push([elementClass, previousElementClass])
//   }

//   /**
//    * Проверяет, нужен ли разделитель между элементами
//    * @param element - текущий элемент
//    * @param previousElement - предыдущий элемент
//    * @returns true, если нужен разделитель
//    */
//   public static isNeedSeparator(element: TElement | undefined, previousElement: TElement | undefined): boolean {
//     if (!element || !previousElement) {
//       return false
//     }

//     return (
//       SeparatorsMap.separators.find(
//         ([elementClass, previousElementClass]) =>
//           (elementClass === undefined || element.type === elementClass.type) &&
//           (previousElementClass === undefined || previousElement.type === previousElementClass.type)
//       ) !== undefined
//     )
//   }
// }

// // SeparatorsMap.register(TElement, TElement)
