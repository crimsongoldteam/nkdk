# InputFieldElement с tsyringe

Этот модуль демонстрирует использование tsyringe для автоматической инъекции зависимостей при создании `InputFieldElement` и `InputFieldElementProperties`.

## Основные компоненты

### InputFieldElementFactory

Фабрика для создания `InputFieldElement` с автоматической настройкой общей стратегии для элемента и его properties.

### Container Configuration

Настройка DI контейнера для регистрации зависимостей.

## Использование

### Базовое использование

```typescript
import "reflect-metadata"
import { container } from "tsyringe"
import { configureFormContainer } from "./container/containerConfig"
import { InputFieldElementFactory } from "./elements/inputFieldElementFactory"

// Настраиваем контейнер
configureFormContainer()

// Получаем фабрику
const factory = container.resolve(InputFieldElementFactory)

// Создаем элемент
const element = factory.create()
```

### Создание с конфигурацией

```typescript
const element = factory.createWithConfig({
  title: "Имя пользователя",
  height: 30,
  multiLine: false,
  choiceButton: false,
  dataPathName: "userName",
})
```

### Создание с кастомной стратегией

```typescript
import { DataPathNameStrategy } from "./mixins/formAttributeableMixin"

const customStrategy = new DataPathNameStrategy()
const element = factory.create(customStrategy)
```

## Преимущества

1. **Единая стратегия**: При создании `InputFieldElement` автоматически создается одна стратегия для элемента и его properties
2. **Автоматическая инъекция**: tsyringe автоматически управляет зависимостями
3. **Гибкость**: Возможность передать кастомную стратегию или использовать предустановленную конфигурацию
4. **Типобезопасность**: Полная поддержка TypeScript

## Архитектура

```
InputFieldElementFactory
├── Создает DataPathNameStrategy
├── Создает InputFieldElementProperties (с той же стратегией)
└── Создает InputFieldElement (с той же стратегией)
```

Это гарантирует, что элемент и его properties используют одну и ту же стратегию для управления данными.
