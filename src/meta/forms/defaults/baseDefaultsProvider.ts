import { IDefaultsProvider } from "./interfaces"

export abstract class BaseDefaultsProvider<T> implements IDefaultsProvider<T> {
  public getDefaults(element: T): Partial<T> {
    const result: Partial<T> = { ...element }

    // Получаем дефолтный экземпляр
    const defaultElement = this.createDefaultElement()

    // Получаем поля для проверки
    const fieldsToCheck = this.getFieldsToCheck(element, defaultElement)

    // Проверяем каждое поле
    for (const fieldName of fieldsToCheck) {
      const currentValue = (element as any)[fieldName]
      const defaultValue = (defaultElement as any)[fieldName]

      if (currentValue !== defaultValue) {
        ;(result as any)[fieldName] = currentValue
      }
    }

    // Применяем дополнительные правила
    this.applyAdditionalRules(result, element)

    return result
  }

  // Абстрактные методы для переопределения в наследниках
  protected abstract createDefaultElement(): T
  protected abstract getFieldsToCheck(element: T, defaultElement: T): string[]
  protected abstract applyAdditionalRules(result: Partial<T>, element: T): void
}
