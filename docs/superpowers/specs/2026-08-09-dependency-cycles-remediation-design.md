# Устранение циклических зависимостей

Статус: согласовано.

## Цель

Полностью устранить циклические зависимости production-модулей, сохранив
текущее публичное поведение, публичные пути импортов и строгий вывод
TypeScript-типов по `rules.ts`.

Итоговый cycle-baseline содержит ноль компонент:

```json
{
  "version": 1,
  "components": []
}
```

Пустой baseline сохраняется, чтобы любое новое циклическое замыкание сразу
останавливало архитектурную проверку в CI.

## Исходное состояние

После устранения нарушений границ осталось:

- 20 циклических компонент;
- 158 вхождений модулей в компоненты;
- 370 внутренних зависимостей;
- крупнейшие компоненты содержат 55, 28, 23 и 9 модулей.

Числа модулей и зависимостей не являются количеством независимых ошибок.
Компоненты сводятся к нескольким повторяющимся причинам: смешение деклараций
и регистрации, импорт высокоуровневой реализации из нижнего слоя, общий barrel
внутри реализации, рекурсивные преобразователи и договоры, принадлежащие
потребителю вместо границы.

## Общие принципы

- Исправления выполняются по архитектурным причинам, а не по отдельным рёбрам.
- Нижний слой объявляет договор; верхний слой реализует его или регистрирует
  обработчик.
- `types.ts` не запускает регистрацию и не импортирует преобразователи.
- Общий barrel используется внешними потребителями, но не внутренними модулями
  той же подсистемы.
- Совместимые публичные пути сохраняются реэкспортами, если реализация
  перемещается.
- Новые поля в `BasePropertyRule`, `PropertyRule` и построители правил не
  добавляются.
- XML-фикстуры не изменяются.

## Локальные компоненты

### Configuration

`childObjects.ts` импортирует `CONFIGURATION_XML_FILE` из высокоуровневого
`rootIO.ts`, а `rootIO.ts` через правила и типы возвращается к child objects.
Константа переносится в независимый `constants.ts`; остальные зависимости
сохраняют естественное направление к `rootIO`.

### GroupItemAuto

`types.ts` сейчас объявляет типы и регистрирует реализации `fromXML`,
`fromYAML` и `toYAML`. Каждая регистрация переносится к соответствующей
реализации. Composition-файл явно импортирует все регистрирующие модули, а
`types.ts` остаётся декларативным.

### ChildFormNames

Цикл проходит через побочные импорты
`commonObjects/index.ts -> syncExternalFromXML.ts -> convertFromXML.ts ->
commonObjects/index.ts`. Регистрация адаптера дочерних форм переносится во
внешнюю точку сборки metadata после загрузки common objects и forms.
`convertFromXML.ts` не загружает общий barrel ради инициализации.

### MetadataValue

Для направлений `fromXML`, `fromYAML`, `toXML` и `toYAML` главный
преобразователь вызывает обработчики составных значений, а они рекурсивно
вызывают главный преобразователь. Рекурсивное ядро каждого направления
собирается в одном глубоком модуле. Старые вложенные пути остаются тонкими
совместимыми реэкспортами и не импортируются ядром обратно.

### Helpers элементов форм

Helpers `autoCommandBar`, `contextMenu`, `searchControlAddition`,
`viewStatusAddition` и `extendedTooltip` используют только небольшую часть
выведенных типов элементов. Вместо импорта `types.ts` они принимают локальный
структурный договор: имя, `childItems`, `autofill` или произвольные поля в
зависимости от операции.

### Правила и выведенные типы

- `MetadataCatalogStandardAttributeNames` переносится из
  `metadataCatalog/types.ts` в `metadataCatalog/rules.ts`.
- `FormRulesTags` переносится из `clientApplicationForm/types.ts` к правилам.
- `MetadataFieldsRules` объявляется рядом с чистыми преобразователями
  metadata path и реэкспортируется из существующего публичного `types.ts`.
- Общие типы `syncState`, data-path formatter, XML importer и platform session
  manager выносятся в независимые узкие `contracts.ts`.

### BaseForm

Из `fromYAMLToXML.ts` выделяется независимое ядро преобразования формы, которое
не импортирует `baseForm.ts` и не выполняет регистрацию property-обработчика.
`baseForm.ts` вызывает это ядро для проекции основной формы. Верхний
`fromYAMLToXML.ts` владеет регистрацией расширения, строит BaseForm и вызывает
то же ядро для итоговой формы.

Публичная функция `convertClientApplicationFormFromYAMLToXML` продолжает
экспортироваться из существующего `fromYAMLToXML.ts`; facade реэкспортирует
реализацию ядра и не импортируется из `baseForm.ts` обратно.

## Формы и orchestration

### ChildItems

`forms/commonObjects/childItems/types.ts` сейчас одновременно содержит
объединения конкретных элементов и построители property-правил. Построители
`commandBarChildItemsRule`, `groupChildItemsRule`, `pagesChildItemsRule` и
`tableChildItemsRule` переносятся в `childItems/rules.ts`, не импортирующий
конкретные элементы.

Целевое направление:

```text
element/rules.ts -> childItems/rules.ts
element/types.ts -> element/rules.ts
childItems/types.ts -> element/types.ts
```

### Context helpers

`context/helpers.ts` импортирует `MetadataItemType` через
`orchestration/index.ts`, из-за чего общий barrel замыкает девять модулей.
Импорт заменяется прямым type-only импортом из
`orchestration/metadataItem/registry.ts`.

Архитектурные тесты запрещают импорт конкретных элементов из
`childItems/rules.ts` и импорт `orchestration/index.ts` из context.

## Context, индексы и топология ресурсов

### Базовый context

`context/types.ts` владеет только базовыми интерфейсами. Поля configuration
index, form elements и YAML diagnostics подключаются владельцами через
TypeScript declaration merging. Конкретные расширения импортируют базовый
context; базовый context не импортирует расширения обратно.

### Локальные индексы

`orchestration/property` объявляет минимальный интерфейс записи локальных
фактов. `project/localIndexes.ts` реализует этот интерфейс. Property-механизм
не принимает конкретный `LocalIndexes` и не импортирует project.

### ResourceTopology

`resourceTopology` становится самостоятельным нижним слоем. Он владеет
нейтральными входными декларациями, компилятором и проекциями и не импортирует
`project` или `orchestration`.

Адаптеры project и rules преобразуют свои правила и project spec в декларации
топологии. Внешняя точка сборки соединяет регистрации. Orchestration получает
готовую топологию или её проекцию, а topology не ищет правила и project spec в
верхних слоях.

Целевое направление:

```text
context <- orchestration <- project
              |               |
              +-> resourceTopology <- adapters
```

## ProjectState, validation и workerPool

### Расширяемый договор worker-операций

`workerPool/types.ts` не импортирует конкретные команды validation, full sync,
import или project query. Нейтральный workerPool объявляет расширяемую карту
операций. Каждая операция дополняет карту своей парой «команда -> результат» и
регистрирует runtime-обработчик во внешней точке сборки.

Повторная регистрация одного ключа завершается понятной ошибкой. Отсутствие
обязательного обработчика проверяется при создании операции, до обработки
файлов проекта.

### Узкие договоры ProjectState

`ProjectStateReadToken`, описание файлового задания и двоичного вклада
разделяются на независимые leaf-модули. Они не импортируют `fileUpdate`, store,
validation или worker-реализации. Конкретный binary adapter создаёт и читает
эти значения.

### Validation adapter

`projectState` владеет хранением, публикацией и заменой состояния, но не
реализацией dependency validation. Сервис получает интерфейс validator извне,
передаёт ему read-only проекцию состояния и принимает diagnostics и вклады.
Реализация остаётся в `validation`.

Validation не импортирует конкретный store или worker pool. Типы результата,
которые принадлежат состоянию проекта, объявляются в договорах ProjectState, а
не в validation.

### Worker executor

`ProjectStateService` получает исполнитель worker-заданий через параметр
создания. Внешняя точка сборки создаёт общий workerPool, validation adapter и
передаёт их сервису. ProjectState больше не импортирует конкретный
`preparedYamlProjectWorkerPool`, а project workers зависят только от узких
договоров состояния.

Целевое направление:

```text
operation implementations -> workerPool contracts
validation                -> projectState contracts
project workers           -> projectState contracts

composition root
  -> workerPool
  -> validation adapter
  -> ProjectStateService
```

## Порядок реализации

1. Устранить локальные циклы констант, типов и прямых импортов.
2. Перенести регистрации `groupItemAuto` и `childFormNames`.
3. Собрать рекурсивные ядра `metadataValue`.
4. Разделить child-items rules/types, очистить helpers элементов и прямой
   импорт context helper.
5. Сделать context нейтральным и развернуть зависимости local indexes и
   resource topology.
6. Разделить договоры ProjectState, validation и workerPool и подключить их во
   внешней точке сборки.

Каждый пункт является отдельным законченным блоком и коммитом. Следующий блок
начинается после зелёных проверок предыдущего.

## Проверки

Для каждого блока:

1. Добавить focused-проверку поведения или архитектурной границы, которая
   фиксирует устраняемую причину.
2. Выполнить focused-тесты и type-check затронутого пакета.
3. Выполнить `pnpm test:architecture`.
4. Пересчитать cycle-baseline только после подтверждённого уменьшения.
5. Выполнить `pnpm duplicates -- --base <исходный-коммит-блока>`.
6. Выполнить `pnpm test` перед завершением блока.

После последнего блока полный dependency-cruiser должен показать ноль
компонент, ноль модулей и ноль внутренних зависимостей. Затем выполняются
повторные `pnpm test`, `pnpm test:architecture` и проверка дублей.

## Критерии завершения

- Cycle-baseline содержит `components: []`.
- `pnpm test:architecture` проходит и запрещает любой новый цикл.
- Прямые и транзитивные нарушения границ остаются на нуле.
- Публичные пути импортов и поведение XML/YAML/JSON Schema сохранены.
- TypeScript-типы, выводимые из `rules.ts`, не расширены до `any`, `unknown`
  или общего `string`.
- Полный `pnpm test` и проверка дублей проходят.
