# Новые границы `core/metadata`

## Контекст

Над проектом в основном работает ИИ, поэтому структура `packages/core/metadata` должна быть не только корректной для TypeScript, но и быстро читаемой: агенту важно понять область изменения за несколько файлов, а не через глобальный обход всего дерева.

Сейчас `core/metadata` уже разделён на крупные области, но фактические зависимости размывают границы:

- `orchestration` содержит универсальные преобразования, но его реестры импортируют типы из `appliedObjects`, `commonObjects` и `forms`;
- `commonObjects` массово зависит от `orchestration`, но также имеет обратные и случайные связи с `forms`;
- `forms` использует общие типы и orchestration, но часть формовых типов попадает в глобальные реестры ядра;
- `validation` и `graphImport` часто ходят в конкретные прикладные объекты напрямую;
- публичный вход `packages/core/index.ts` импортирует `metadata/appliedObjects`, что регистрирует широкий набор поведения побочным эффектом.

Первый найденный пример случайной связности: многие `commonObjects/*` импортируют `PropertyRule` из `~/metadata/forms/elements/calendarField/rules`, хотя правильный владелец этого типа — `orchestration/property/types`.

## Цели

1. Сделать границы `core/metadata` самообъясняющимися через кодовые входы, а не через внешние навигационные карты.
2. Снизить токены на исследование типовой задачи: агент должен начинать с публичного входа области и читать соседние файлы, а не глобальные реестры.
3. Уменьшить связанность `orchestration` с конкретными metadata-типами.
4. Сохранить поведение XML/YAML round-trip и текущие публичные API.
5. Дать проверяемые правила импортов, чтобы границы не размывались снова.

## Не цели первой очереди

- Не переносить массово XML/YAML-фикстуры.
- Не менять формат `rules.ts`.
- Не переписывать все реестры за один шаг.
- Не менять публичный контракт CLI и расширения VS Code.
- Не удалять существующие тесты до появления равноценных пограничных тестов.

## Целевая модель границ

`orchestration` — универсальное ядро. Оно знает только о контрактах правил, обходе модели, XML/YAML/JSON Schema-преобразованиях, графовых операциях и регистрации обработчиков. Оно не импортирует конкретные applied/form/common-типы, кроме временно разрешённых переходников с явным названием.

`appliedObjects` — владельцы верхнеуровневых объектов 1С. Каждый объект экспортирует правило, типы, публичные преобразователи и регистрацию своего поведения. Папка `appliedObjects` может импортировать `commonObjects`, `forms`, `context`, `orchestration`, но внешние области не должны зависеть от конкретных applied object без отдельного публичного реестра.

`commonObjects` — переиспользуемые доменные блоки. Они могут зависеть от `orchestration`, `context`, `helpers`, `systemEnumerations`, а также от соседних common object. Связи с `forms` допускаются только через явно выделенные общие контракты или переходники, потому что иначе обычный property-тип начинает тянуть форму целиком.

`forms` — модель управляемых форм, элементы форм и формовые common objects. Она может зависеть от `commonObjects` и `orchestration`, но её типы не должны становиться источником общих типов для `commonObjects`.

`validation` — слой проверок проекта. Он должен использовать публичные входы metadata и registry-API, а не импортировать конкретные правила объектов напрямую там, где можно работать через регистрацию.

`graphImport` — прикладная сборка графового импорта. Конкретные верхнеуровневые rules регистрируются здесь или рядом с владельцами объектов, но универсальный graph-import внутри `orchestration` остаётся без конкретных импортов.

## Публичные входы областей

У каждой крупной области должен быть короткий `index.ts` или набор явно названных входов:

- `metadata/orchestration/index.ts` экспортирует только универсальные контракты и функции ядра;
- `metadata/appliedObjects/index.ts` запускает регистрацию applied objects и экспортирует публичный реестр верхнеуровневых объектов;
- `metadata/commonObjects/index.ts` запускает регистрацию common objects, но не становится свалкой всех типов;
- `metadata/forms/index.ts` экспортирует публичные преобразователи формы и регистрацию элементов;
- `metadata/validation/index.ts` экспортирует проверки проекта и файлов;
- `metadata/graphImport/index.ts` экспортирует прикладной graph-import без раскрытия внутренних путей.

Глубокий импорт допустим внутри одной области. Между областями предпочтителен импорт через публичный вход или через узкий контрактный файл с говорящим именем.

## Почему текущие связи появились

Перед запретами нужно разделить существующие связи по причине, иначе allowlist станет способом замаскировать проблему.

### Случайные обходные импорты

`commonObjects/*` импортируют `PropertyRule` из `~/metadata/forms/elements/calendarField/rules`. Этот файл не владеет типом, а только переэкспортирует его. Настоящий владелец — `~/metadata/orchestration/property/types`.

Это механическая ошибка направления зависимости: common object начинает тянуть конкретный элемент формы только ради общего типа. Такие связи нужно убрать сразу и запретить тестом.

### Прикладная логика миграций внутри orchestration

`orchestration/appliedObject/syncToXML.ts` импортирует `remapReferenceModel` и `XmlSyncManifest` из `appliedObjects/configuration/migrations`. Причина понятна: sync прикладного объекта должен учитывать миграции configuration при сохранении `_uuid` и reference-данных.

Но направление зависимости неправильное: универсальный sync-слой знает о конкретной configuration-миграции. Целевой разрез — инвертировать зависимость. `syncAppliedObjectToXML` должен принимать необязательный переходник миграций через параметры или через узкий контракт, а `configuration/syncToXML.ts` подключает `remapReferenceModel` снаружи.

### Формовые типы внутри formElement-ядра

`orchestration/formElement/*` импортирует `BaseElement`, `NamedElement` и часть form-specific преобразований из `forms`. Причина в том, что исторически formElement-оркестратор развивался вместе с моделью управляемых форм, а не как полностью универсальное ядро.

Выбранный исход — разделить этот модуль на две части:

1. нейтральный реестр операций property-типов, который нужен `property/*`, `metadataItem/*`, `metadataCollection/*` и `appliedObject/*`;
2. формовый слой элементов, который знает про `BaseElement`, `NamedElement`, XML/YAML/Enterprise/JSONSchema элементов формы и регистрацию конкретных `forms/elements/*`.

Так `orchestration` сохраняет универсальный механизм регистрации обработчиков, но перестаёт выглядеть владельцем модели элементов формы.

### Глобальные registry-типы

`orchestration/property/registry.ts` и `orchestration/metadataItem/registry.ts` импортируют типы почти всех applied/common/form-объектов. Причина — TypeScript union-ы используются как центральный словарь всех известных property/item типов.

Это главный источник токенов и связанности, но его нельзя чинить первой механической правкой. Целевой разрез: базовый registry-контракт остаётся в `orchestration`, а расширения типов живут рядом с владельцами через локальные registry-модули и расширение модуля TypeScript. До этого нужно убрать очевидные случайные зависимости, развязать sync-миграции и вынести type-rule registry из `formElement`.

Важно разделить две роли текущих файлов:

- типовой словарь: `PropertyTypeRegistry`, `MetadataItemTypeRegistry`, `PropertyRuleType`, `MetadataItemType`, `ToMetadata`, `ToYAML`, `PropertyToYAML`;
- данные времени выполнения: `PropertyRuleTypeKeys`, который сейчас нужен только `property/toEnterprise.ts`.

Типовой словарь можно расширять через TypeScript, а данные времени выполнения должны пополняться явной регистрацией, чтобы порядок и состав ключей не зависели от того, какие файлы попали в компиляцию.

## Порядок срезов

### Срез 1. Убрать `commonObjects -> forms/elements`

Это первый безопасный срез без изменения поведения:

1. добавить общий `metadata/importBoundaries.test.ts`;
2. запретить в нём импорты из `packages/core/metadata/commonObjects/**` в `~/metadata/forms/elements/*`;
3. механически заменить импорты `PropertyRule` из `forms/elements/calendarField/rules` на `orchestration/property/types`;
4. проверить `pnpm --filter @nakidka/core test` и полный `pnpm test`.

Ожидаемый результат: `commonObjects` перестаёт тянуть конкретные элементы формы ради общего типа, а новый тест не даёт вернуть эту связь.

### Срез 2. Развязать `syncAppliedObjectToXML` и миграции configuration

Цель — убрать импорт `appliedObjects/configuration/migrations/*` из `orchestration/appliedObject/syncToXML.ts`.

В этом срезе есть две разные зависимости.

Первая зависимость — `remapReferenceModel`. Это именно configuration/migrations-логика: она знает, как путь текущего YAML-объекта связан со старым XML reference-путём после применения миграций. Её нельзя переносить в `orchestration`, иначе универсальный sync-слой начнёт знать о миграциях configuration.

Целевой контракт:

- `syncAppliedObjectToXML` принимает необязательный параметр `referenceModelRemapper`;
- тип переходника живёт в `orchestration/appliedObject`, потому что это часть универсального sync-контракта;
- переходник получает `rule`, `currentModel` и загруженный `referenceModel`, возвращает remapped reference model;
- `syncAppliedObjectToXML` больше не принимает `currentObjectPath` и `referencePathByCurrentPath`;
- `configuration/syncToXML.ts` замыкает `currentObjectPath` и `migrationResult.referencePathByCurrentPath` внутри функции и передаёт её в `referenceModelRemapper`;
- `remapReferenceModel` остаётся в `appliedObjects/configuration/migrations/referenceRemap.ts`.

Вторая зависимость — `XmlSyncManifest`. Название и текущий путь выглядят как часть миграций configuration, но большинство потребителей используют только метод `addFile(absPath)`: `commonObjects`, `forms`, `orchestration` и external sync-обработчики просто сообщают, какие XML-файлы были записаны.

Целевой контракт:

- в нейтральном модуле, например `metadata/orchestration/xmlWriteManifest.ts`, появляется маленький интерфейс `XmlWriteManifest` с методом `addFile(absPath: string): void`;
- параметры `xmlManifest` в `orchestration`, `commonObjects` и `forms` типизируются через `XmlWriteManifest`;
- класс `XmlSyncManifest` и `pruneXmlByManifest` могут остаться в `appliedObjects/configuration/migrations/xmlManifest.ts`, потому что configuration-синхронизация создаёт manifest, читает `expectedFiles()` и выполняет очистку;
- `XmlSyncManifest` структурно совместим с `XmlWriteManifest`, поэтому его можно передавать в общий sync-контракт без знания о configuration-модуле.

Этот срез должен быть покрыт существующими migration/sync-тестами configuration и узким тестом, что `orchestration/appliedObject` больше не импортирует `appliedObjects/configuration`.

### Срез 3. Разделить `formElement` на реестр property-типов и слой форм

`orchestration/formElement/factory.ts` сейчас хранит `registerTypeRule`, `getTypeRule` и `clearTypeRulesRegistry`. По факту это не реестр элементов формы, а общий реестр обработчиков property-типа: import/export XML, import/export YAML, Enterprise, JSON Schema, graph и external sync.

Целевой разрез:

- создать нейтральный модуль `metadata/orchestration/property/typeRuleRegistry.ts`;
- перенести туда `registerTypeRule`, `getTypeRule`, `clearTypeRulesRegistry` и типизацию операций из текущего `formElement/factory.ts`;
- перевести `orchestration/property/*`, `metadataItem/*`, `metadataCollection/*`, `appliedObject/*`, `commonObjects/*`, `forms/*` и `appliedObjects/*` на новый импорт;
- оставить временный переэкспорт из `orchestration/formElement/factory.ts`, если это сильно уменьшает размер одного изменения, но запретить новые импорты оттуда тестом границ;
- оставить `ElementRule`, `registerElementRule`, `registerElementAsType`, XML/YAML/Enterprise/JSONSchema helpers и `singletonName` в формовом слое;
- после миграции перенести формовый слой из `metadata/orchestration/formElement/*` в `metadata/forms/elements/orchestration/*` или близкий по смыслу путь;
- дать `metadata/forms/index.ts` публичный вход для регистрации элементов формы.

Почему не переносить весь `formElement` сразу: `property/*` и `metadataItem/*` сейчас используют только type-rule registry, а не модель формы. Сначала нужно дать им нейтральный источник, и только после этого переносить оставшуюся формовую часть без большого каскада правок.

Критерий завершения среза: в универсальном `orchestration` нет импортов из `forms/elements/baseElement/types`, а новые обработчики property-типов регистрируются через `orchestration/property/typeRuleRegistry`, не через `formElement/factory`.

### Срез 4. Разделить глобальные registry-типы

Это самый крупный срез и его не стоит делать до первых трёх.

Целевая форма:

- `orchestration/property/registry.ts` хранит пустой расширяемый контракт `export interface PropertyTypeRegistry {}` и helper-типы вокруг него;
- `orchestration/metadataItem/registry.ts` хранит пустой расширяемый контракт `export interface MetadataItemTypeRegistry {}` и helper-типы вокруг него;
- конкретные property-типы добавляют записи рядом со своим владельцем через `declare module "~/metadata/orchestration/property/registry"`;
- конкретные metadata item-типы добавляют записи рядом со своим владельцем через `declare module "~/metadata/orchestration/metadataItem/registry"`;
- локальный файл расширения называется единообразно: `registry.ts` или `registry.types.ts`;
- новые metadata-типы добавляются через локальный registry-файл и публичный вход регистрации области, а не через правку огромного глобального файла.

Пример целевой формы для property-типа:

```ts
import type { I8nText, I8nTextYAML } from "./types"

declare module "~/metadata/orchestration/property/registry" {
  interface PropertyTypeRegistry {
    I8nText: {
      item: I8nText
      enterprise: string
      yaml: I8nTextYAML
    }
  }
}
```

Пример целевой формы для metadata item:

```ts
import type { MetadataCatalog, MetadataCatalogYAML } from "./types"

declare module "~/metadata/orchestration/metadataItem/registry" {
  interface MetadataItemTypeRegistry {
    MetadataCatalog: {
      metadata: MetadataCatalog
      yaml: MetadataCatalogYAML
    }
  }
}
```

Порядок миграции:

1. Сделать текущие `PropertyTypeRegistry` и `MetadataItemTypeRegistry` расширяемыми `interface`, но временно оставить их наполнение в старых файлах.
2. Добавить договорённость и тест границ: новые записи registry не добавляются в глобальные файлы.
3. Перенести несколько небольших common object записей в локальные `registry.types.ts`, чтобы проверить схему.
4. Перенести формовые записи после среза 3, когда `formElement` уже отделён от нейтрального type-rule registry.
5. Перенести applied object записи через публичные входы `appliedObjects`.
6. Когда глобальные файлы перестанут импортировать конкретные типы, оставить в них только контракты и helper-типы.

`PropertyRuleTypeKeys` не должен собираться из `Object.keys({ ... } satisfies Record<PropertyRuleType, PropertyRuleType>)` в глобальном файле. Для него нужен отдельный реестр времени выполнения, например `property/propertyTypeKeys.ts`, с функцией `registerPropertyRuleTypes(keys)`. Области регистрируют свои ключи рядом с регистрацией обработчиков; `property/toEnterprise.ts` проверяет ключ через этот реестр.

На время миграции допустим `legacyRegistryTypes.ts`, но новые типы туда не добавляются. Его задача — явно показать оставшийся долг, а не стать новым постоянным реестром.

## План первой очереди

### 1. Зафиксировать правила импортов

Добавить vitest-проверки для запрещённых направлений:

- `commonObjects` не импортирует `forms/elements/*`;
- `orchestration/appliedObject` не импортирует `appliedObjects/configuration/*` после среза 2;
- `orchestration` не добавляет новые импорты `appliedObjects/*`, `forms/*` и конкретных `commonObjects/*` сверх зафиксированного списка исторических нарушений;
- `validation` не импортирует конкретный applied object, если существует общий registry-вход;
- новые cross-area импорты должны идти через публичные входы или контрактные файлы.

Проверка должна быть простой и локальной: по примеру существующего `metadata/orchestration/graphImport/noConcreteMetadataImports.test.ts`. Для старых нарушений используется allowlist с точным путём файла, импортом, причиной и целевым способом удаления. Allowlist — временный диагностический список, а не разрешение оставить связь навсегда.

### 2. Убрать очевидные случайные связи

Первый безопасный кандидат — заменить импорты `PropertyRule` из `forms/elements/calendarField/rules` на правильный источник `orchestration/property/types`.

Это должно уменьшить ложную зависимость `commonObjects -> forms` без изменения поведения.

### 3. Разделить `formElement` на нейтральный registry и формовый слой

Сначала нужно вынести `registerTypeRule/getTypeRule` из `orchestration/formElement/factory.ts` в `orchestration/property/typeRuleRegistry.ts`.

После этого:

- универсальные property-операции импортируют type-rule registry из `property`;
- формовые elements продолжают регистрировать свои правила, но делают это через нейтральный registry;
- оставшаяся часть `formElement` становится кандидатом на перенос в `forms/elements/orchestration`;
- тест границ запрещает новые импорты `orchestration/formElement/factory` вне временного списка.

### 4. Разделить глобальные реестры на контракт и наполнение

Текущие `orchestration/property/registry.ts` и `orchestration/metadataItem/registry.ts` одновременно:

- описывают универсальный контракт registry;
- импортируют конкретные типы всех областей;
- становятся файлом, который агент вынужден читать даже при локальной задаче.

Целевая форма:

- в `orchestration` остаются только расширяемые registry-контракты и helper-типы;
- конкретные расширения registry живут рядом с владельцами типов через расширение модуля TypeScript;
- `appliedObjects`, `commonObjects` и `forms` сами подключают свои расширения через публичные входы регистрации;
- ключи property-типов времени выполнения регистрируются отдельно от типового словаря.

Первый шаг не обязан полностью удалить старые реестры. Допустим переходный модуль `legacyRegistryTypes.ts`, если он явно помечает долг и не расширяется новыми типами. Проверка границ должна падать, если новая запись добавлена в переходный файл вместо локального registry-файла владельца.

### 5. Сузить побочные регистрации

`packages/core/index.ts` сейчас импортирует `./metadata/appliedObjects`, что запускает широкий набор регистраций. Нужно выделить явный вход регистрации metadata, чтобы публичный API показывал намерение:

- `registerCoreMetadata()` или близкая по смыслу функция для явной регистрации;
- временно сохранить старый побочный импорт, если это нужно для совместимости;
- тестом зафиксировать, какие публичные сценарии требуют регистрации.

Если явная регистрация ломает слишком много входов, первая очередь ограничивается документированным `metadata/register.ts` и постепенной миграцией внутренних импортов.

## Поток работы после изменений

При задаче в applied object агент начинает с папки конкретного объекта и его `rules.ts`; при необходимости идёт в публичный вход `appliedObjects` и только затем в orchestration-контракты.

При задаче в common object агент читает локальный `types.ts`, `rules.ts`, `fromXML/toXML/fromYAML/toYAML` и registry-вход этого common object. Формовые элементы не попадают в маршрут, если задача не касается форм напрямую.

При задаче в orchestration агент работает с контрактами и пограничными тестами ядра. Конкретные объекты используются только как тестовые fixtures через утверждённые тестовые входы.

## Обработка ошибок и совместимость

Запрещённые импорты должны падать понятным тестом с текстом: какая область нарушила границу, какой импорт найден и какой вход использовать вместо него.

Переходные исключения должны быть явными: список разрешённых нарушений хранится рядом с тестом, каждое исключение содержит короткую причину и целевой способ удаления. Новые исключения не добавляются без отдельного решения.

Публичные API `@nakidka/core`, CLI и расширения VS Code остаются совместимыми. Если потребуется изменить способ регистрации, старый путь сохраняется на время миграции.

## Тестирование

Для первой очереди нужны проверки трёх уровней:

1. Статические тесты границ импортов.
2. Узкие тесты на устранённые случайные связи, например что `commonObjects` больше не импортирует `forms/elements/calendarField/rules`.
3. Существующий полный `pnpm test` из корня.

Для изменений registry дополнительно нужны пограничные тесты:

- импорт/экспорт YAML для объекта, который использует common object;
- импорт/экспорт формы, которая использует form common object;
- graph-import для верхнеуровневого объекта через публичный вход регистрации.

## Метрики успеха

- Количество импортов `commonObjects -> forms` уменьшается в первой очереди.
- `orchestration` перестаёт добавлять новые импорты конкретных applied/form/common-типов.
- У каждого нового metadata-типа есть локальный публичный вход регистрации, а не ручное расширение глобального реестра в ядре.
- Агенту для типовой задачи больше не нужно читать `property/registry.ts` или `metadataItem/registry.ts` целиком.

## Риски

Главный риск — расширение модуля TypeScript может сделать типы менее очевидными, если разнести registry-расширения без соглашения. Поэтому расширения должны лежать рядом с владельцем типа и называться единообразно, например `registry.ts` или `registry.types.ts`.

Второй риск — часть текущего поведения держится на порядке побочных импортов. Перед изменением входов регистрации нужно покрыть публичные сценарии тестами и мигрировать регистрацию по слоям.

Третий риск — слишком агрессивные запреты импортов могут остановить полезную работу. Поэтому первая проверка должна иметь малый набор правил и явный список временных исключений.

## Первая реализация

Первая реализация должна быть небольшой:

1. Добавить тест границ импортов для `commonObjects -> forms/elements/*`.
2. Заменить импорты `PropertyRule` из `forms/elements/calendarField/rules` на `orchestration/property/types`.
3. Проверить `pnpm --filter @nakidka/core test`.
4. Проверить полный `pnpm test`.
5. Следующим отдельным изменением спроектировать и выполнить срез 2: инвертировать зависимость `syncAppliedObjectToXML` от миграций configuration.
