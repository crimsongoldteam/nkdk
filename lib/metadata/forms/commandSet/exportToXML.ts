import { TCommandSet, TCommandSetXML } from "./types"

export const exportCommandSetToXML = (
  data: TCommandSet | undefined
): TCommandSetXML | undefined => {
  if (!data || data.length === 0) return undefined

  // Для одного элемента возвращаем строку, для нескольких - массив
  // XML builder с oneListGroup: true объединяет элементы с одинаковым именем,
  // но это нормально для импорта, так как парсер правильно обрабатывает несколько элементов
  if (data.length === 1) {
    return {
      ExcludedCommand: data[0],
    }
  }

  return {
    ExcludedCommand: data,
  }
}
