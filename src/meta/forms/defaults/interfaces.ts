// Интерфейс для провайдера дефолтных значений
export interface IDefaultsProvider<T> {
  getDefaults(element: T): Partial<T>
}

// Интерфейс для сервиса получения дефолтных значений
export interface IDefaultsService {
  getDefaults<T>(element: T): Partial<T>
}
