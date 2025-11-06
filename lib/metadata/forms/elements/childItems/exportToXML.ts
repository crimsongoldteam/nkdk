import { ZChildItems, TChildItemsXML } from "./types"
import { exportElementToXML } from "~/lib/xml/export/exporterFactory"
import z from "zod"

export const exportChildItemsToXML = (
  data: z.infer<typeof ZChildItems> | undefined
): TChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  // Объединяем элементы одного типа в массивы для правильного экспорта
  // Это позволяет создать один блок <ChildItems> с несколькими дочерними элементами
  // Сохраняем порядок элементов, группируя их по типу, но сохраняя порядок первого вхождения каждого типа
  const grouped: Record<string, any[]> = {}
  const typeOrder: string[] = []

  for (const item of data) {
    const exported = exportElementToXML(item)
    const elementType = Object.keys(exported)[0]
    if (!grouped[elementType]) {
      grouped[elementType] = []
      typeOrder.push(elementType)
    }
    grouped[elementType].push(exported[elementType as keyof typeof exported])
  }

  // Создаем массив с правильным порядком элементов на основе порядка типов
  const result: TChildItemsXML = []
  for (const type of typeOrder) {
    for (const item of grouped[type]) {
      result.push({ [type]: item } as any)
    }
  }

  return result
}
