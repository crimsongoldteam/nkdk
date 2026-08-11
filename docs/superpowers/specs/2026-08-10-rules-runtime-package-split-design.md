# Разделение rules и runtime на два пакета

Статус: согласованная спецификация после анализа первой попытки реализации и
актуального `origin/develop`.

## Контекст

`packages/core` совмещает две разные ответственности:

- описание конкретной модели: `rules.ts`, типы объектов, формы, project specs,
  validation-политики и профили операций;
- общий механизм исполнения: XML/YAML-преобразования, project state,
  validation-исполнители, import/sync/operations, worker и файловую
  координацию.

Внутри `core` уже существуют логические нейтральные слои `ruleRuntime`,
`diagnostics`, `validation`, `projectDefinition`, `project`, `projectState` и
`resourceTopology/core`. Цель работы — довести эту границу до двух физических
private workspace-пакетов без изменения XML/YAML-семантики:

```text
@nkdk/rules ─────────▶ @nkdk/runtime
       │                       ▲
       └────── MCP ────────────┘
              composition root
```

`@nkdk/runtime` никогда не импортирует `@nkdk/rules`. MCP импортирует оба
пакета, передаёт определение rules и worker manifest при создании runtime.

## Что показала первая попытка

Первая реализация подтвердила правильное направление зависимости, но начала с
массового переноса `packages/core/**`. В результате:

- архитектурное изменение смешалось с переименованием тысяч файлов;
- `@nkdk/rules` получил широкий доступ к `@nkdk/runtime/internal/*`;
- новый bundle собирался как снимок старых side effects;
- старые и новые реестры существовали одновременно;
- часть lookup продолжала читать module-level `Map`;
- worker переносились раньше, чем появился явный договор rules;
- baseline dependency-cruiser скрыл новые нарушения.

Из первой ветки можно переносить вручную только отдельные идеи и тестовые
сценарии. Массовые коммиты, журнал совместимости, двойная запись и изменения
baseline повторно не используются.

## Рассмотренные подходы

### (А) Сначала семантическая, затем физическая граница — выбран

Сначала внутри `core` вводятся явное определение rules, экземплярные реестры и
runtime API. Только законченные и проверенные зоны затем переносятся в два
пакета.

### (Б) Сразу создать два пакета и временные мосты — отклонён

Физические package imports появились бы раньше рабочего договора и потребовали
бы временных globals, широкого `internal` API или двойной записи.

### (В) Сохранить `@nkdk/core` как фасад — отклонён

Пакет private, а реальные потребители находятся в том же workspace. Фасад
сохранил бы третью точку композиции и старую неявную инициализацию.

## Принятые решения

1. Конечные пакеты называются `@nkdk/rules` и `@nkdk/runtime`.
2. Оба пакета private и встраиваются в самостоятельную сборку MCP.
3. `@nkdk/core` удаляется после перевода потребителей; совместимый фасад не
   сохраняется.
4. Production-зависимость направлена только `rules → runtime`.
5. Импорт любого пакета не регистрирует rules, не запускает worker и не меняет
   состояние процесса.
6. В production MCP лениво создаёт один runtime и использует его до остановки
   сервера.
7. Тесты обязаны поддерживать два одновременно созданных runtime с разными
   наборами rules — это доказательство отсутствия скрытых globals.
8. Публично переносится только договор, реально используемый MCP. Широкий API
   старого `core` не сохраняется.
9. В новых именах пакетов, API, типов и документации не используется имя
   внешней платформы.

## Ответственность пакетов

### `@nkdk/runtime`

Runtime владеет механизмами, работающими с любым переданным определением rules:

- нейтральными договорами и исполнителями `ruleRuntime`;
- общими XML/YAML-механизмами;
- `diagnostics`, нейтральными частями validation и project;
- project definition и project state;
- `resourceTopology/core` и общими проекциями;
- исполнителями import, sync и metadata operations;
- worker pool, транспортом, очередями и жизненным циклом;
- экземплярными таблицами rules и зависимыми от runtime кэшами;
- `createMetadataRuntime`.

Runtime не содержит:

- конкретных типов объектов, форм и свойств;
- конкретных project specs, validation-политик и профилей операций;
- условий по конкретным `itemType`, XML-корням и каталогам проекта;
- импортов rules-пакета, включая type-only imports.

### `@nkdk/rules`

Rules владеет содержанием конкретной модели:

- `commonObjects`, `forms`, `appliedObjects`, `systemEnumerations`;
- `rules.ts`, обработчиками свойств и элементов;
- конкретными project specs, схемами и ресурсными декларациями;
- adapters resource topology;
- вкладами validation, data path и references;
- descriptors import, sync и metadata operations;
- явной композицией `metadataRules`;
- worker entrypoint, статически загружающими `metadataRules`;
- round-trip, schema, validation и интеграционными тестами модели.

Путь текущего файла не определяет владельца. Общий исполнитель из конкретного
каталога переносится в runtime, а конкретный adapter из общего каталога — в
rules.

## Определение rules

Runtime экспортирует из `@nkdk/runtime/rule-kit` только типы и builders,
необходимые rules-пакету:

```ts
export interface MetadataRulesDefinition {
  readonly propertyTypes: Readonly<Record<string, PropertyTypeDescriptor>>
  readonly metadataItems: Readonly<Record<string, MetadataItemDescriptor>>
  readonly formElements: Readonly<Record<string, FormElementDescriptor>>
  readonly systemEnumerations: Readonly<Record<string, EnumerationDescriptor>>
  readonly schemas: Readonly<Record<string, SchemaDescriptor>>
  readonly projectSpecs: Readonly<Record<string, ProjectSpecDescriptor>>
  readonly resourceTopology: readonly ResourceTopologyDescriptor[]
  readonly validation: readonly ValidationDescriptor[]
  readonly dataPaths: readonly DataPathDescriptor[]
  readonly references: readonly ReferenceDescriptor[]
  readonly components: readonly ComponentDescriptor[]
  readonly imports: readonly ImportDescriptor[]
  readonly synchronization: readonly SyncDescriptor[]
  readonly operations: readonly OperationDescriptor[]
  readonly workerOperations: readonly WorkerOperationDescriptor[]
}

export function defineMetadataRules(
  definition: MetadataRulesDefinition,
): MetadataRulesDefinition

export function composeMetadataRules(
  ...layers: readonly MetadataRulesDefinition[]
): MetadataRulesDefinition
```

Договор остаётся структурированным: именованные таблицы используются для
записей с одним владельцем, массивы — для упорядоченных обработчиков. Если при
инвентаризации обнаружится новая самостоятельная категория, она сначала
добавляется в этот договор, а не передаётся через произвольный callback.

`defineMetadataRules()` только обеспечивает TypeScript-договор. Отдельных
`compileMetadataRules`, `CompiledMetadataRules`, `id`, `apiVersion` и
`revision` нет.

`composeMetadataRules(...)` объединяет слои в явно заданном порядке:

- в именованной таблице поздняя запись заменяет раннюю, сохраняя нынешнюю
  семантику `Map.set()`;
- массивы обработчиков объединяются в порядке слоёв;
- скрытого порядка загрузки файлов и side-effect imports нет.

Предварительная проверка полноты rules, конфликтов и межкатегорийных ссылок в
эту работу не входит. Существующее поведение продолжают проверять текущие
тесты и исполнители.

## Экземплярное состояние

`createMetadataRuntime()` копирует секции definitions в собственные таблицы.
`readonly` защищает входной договор на уровне TypeScript; рекурсивный
`Object.freeze` и полное клонирование графа не применяются.

Запрещены:

- module-level `Map`/`Set` для регистрации rules;
- `clear...ForTests()` как способ изоляции;
- lookup без ссылки на runtime, его bound service или execution context;
- регистрация во время чтения проекта, построения схемы или операции;
- одновременная запись в старый и новый реестр.

Каждый старый реестр мигрирует атомарно как отдельный законченный слой:

1. Добавляется экземплярный реестр.
2. Все записи и чтения категории переводятся на него.
3. Добавляется тест двух runtime с пересекающимися ключами.
4. Старый global registry и его test-clear удаляются.

Если весь слой нельзя перевести за один шаг, слой не считается законченным и
следующая категория не начинается. Переходник к singleton runtime не вводится.

## Публичная граница

Runtime имеет только осознанные exports:

- `@nkdk/runtime` — создание runtime и публичные нейтральные договоры;
- `@nkdk/runtime/rule-kit` — договор определения rules;
- `@nkdk/runtime/worker` — нейтральные worker contracts и исполнители.

Публичного `@nkdk/runtime/testing`, wildcard `./internal/*` и exports,
повторяющих внутреннее дерево каталогов, нет.

Корень `@nkdk/rules` экспортирует только `metadataRules`. Именованные subpath
`@nkdk/rules/workers/*` экспортируют entrypoint для сборки MCP. Concrete-типы
rules не протекают в публичные типы runtime.

Сгенерированные `.d.ts` runtime проверяются без установленного rules-пакета.

## Runtime API и жизненный цикл

`createMetadataRuntime()` синхронен: он создаёт экземплярные таблицы, но не
запускает worker. Worker manifest обязателен, сами pool создаются лениво.

```ts
export interface CreateMetadataRuntimeOptions {
  readonly rules: MetadataRulesDefinition
  readonly workers: MetadataWorkerManifest
}

export function createMetadataRuntime(
  options: CreateMetadataRuntimeOptions,
): MetadataRuntime

export interface MetadataRuntime {
  readonly projects: ProjectServices
  readonly validation: ValidationServices
  readonly import: ImportServices
  readonly sync: SyncServices
  readonly metadata: MetadataOperationServices
  close(): Promise<void>
}
```

Группы покрывают фактически используемый MCP договор:

- `projects`: создание state, разбор project path и описание структуры;
- `schemas`: экспорт схемы файла или именованной схемы, поиск и сокращённое
  представление;
- `validation`: проверка проекта;
- `import`: импорт из XML;
- `sync`: построение плана, синхронизация в XML и инициализация sync state;
- `metadata`: переименование и поиск ссылок.

Неиспользуемые exports старого `core` не переносятся. Инвентаризация на этапе 0
проверяет этот список против production-вызовов MCP и не расширяет его без
отдельного обоснования.

Project state остаётся явным:

- `runtime.projects.createState()` создаёт `ProjectStateService`;
- операции получают state параметром, как сейчас;
- state принадлежит создавшему runtime и не используется другим runtime;
- `state.close()` и `runtime.close()` идемпотентны;
- `runtime.close()` закрывает все созданные им state и worker pool;
- MCP при остановке закрывает только runtime.

Ошибки данных остаются существующими diagnostics/results. Ошибки файловой
системы, worker и неверного lifecycle продолжают выбрасываться как обычный
`Error` с понятным сообщением. Новая иерархия классов ошибок не вводится.

## Worker и сборка

Функции rules не передаются через structured clone. Каждый production worker
статически импортирует `metadataRules` через entrypoint rules-пакета.

Распределение ответственности:

- runtime владеет протоколом, очередью, pool и нейтральным исполнителем;
- rules владеет исходными worker entrypoint;
- MCP собирает официальные exports rules в файлы своего `dist`;
- MCP формирует `MetadataWorkerManifest` с путями к готовым файлам;
- runtime получает manifest через `createMetadataRuntime({ rules, workers })`.

MCP не обращается к путям `packages/rules/**` или `packages/runtime/**`.
Текущая топология worker сохраняется; их объединение является отдельной
оптимизацией.

При аварии worker:

- текущая операция завершается ошибкой;
- автоматического повтора нет;
- worker этой операции уничтожаются;
- следующий отдельный вызов может создать новые worker.

Hash, handshake, rules identity и привязка persisted caches к rules revision не
добавляются. Соответствие main/worker проверяется интеграционными тестами
сборки.

## Composition root MCP

MCP является единственным production-местом, знающим оба пакета:

```ts
const runtime = createMetadataRuntime({
  rules: metadataRules,
  workers: createMcpWorkerManifest(import.meta.url),
})
```

Runtime создаётся лениво при первом обращении и затем переиспользуется. Старый
`projectStateHandle` заменяется владением внутри runtime; отдельная глобальная
точка закрытия project state не сохраняется.

## Особенности текущего репозитория

### Регистрация остаётся побочной

Часть верхнеуровневых `index.ts` регистрирует rules импортом модуля. Явные
`register...()` не отражают полный фактический порядок. Каждый такой модуль
должен экспортировать descriptor или секцию definition без side effects.

### Нейтральные слои ещё содержат globals

Module-level таблицы остаются в property/item/form registries,
projectDefinition, validation/data path, resource topology, components,
import/sync и worker operations. Нейтральное расположение файла не означает,
что его состояние экземплярно.

### Сборка MCP владеет чужими исходными путями

Сборщик MCP сейчас входит непосредственно в worker-файлы `packages/core`.
После разделения он использует только именованные exports rules и runtime.

### Публичный API старого core слишком широк

MCP использует ограниченный набор project state, validation, schema,
import/sync и metadata operation contracts. Перед удалением `core/index.ts`
составляется машинная инвентаризация реальных imports. Остальные exports не
переносятся автоматически.

### Исходное состояние нужно измерить заново

До реализации выполняются актуальные проверки на том же commit и в той же
среде. Несвязанные падения не исправляются в этой работе. Если они мешают
обязательной финальной проверке, реализация останавливается и состояние
сообщается отдельно.

## Стратегия перехода

### Этап 0. Зафиксировать исходное состояние

- Создать implementation-worktree от актуального `origin/develop`.
- Зафиксировать base commit для duplicate-проверок.
- Выполнить type-check, архитектурные проверки и полный test.
- Инвентаризировать публичный API MCP, globals и side-effect registrations.
- Не создавать и не обновлять dependency-cruiser baseline.

### Этап 1. Ввести договор rules внутри `core`

- Добавить структурированный `MetadataRulesDefinition`,
  `defineMetadataRules()` и `composeMetadataRules()`.
- Перевести одну нижнюю категорию на явные descriptors и экземплярный реестр.
- Сохранить существующую XML/YAML-семантику и порядок обработчиков.
- Не создавать новый пакет на этом этапе.

### Этап 2. Перевести реестры на экземплярное состояние

Мигрировать атомарными категориями, начиная с нижних:

1. property/item/form-element/system-enumeration;
2. schema и projectDefinition;
3. resource topology;
4. validation/data path/references;
5. components, import, sync, operations и worker operations.

После каждого слоя удалять соответствующие global registry и test-clear. Не
использовать двойную запись и singleton-переходники.

### Этап 3. Собрать рабочий `metadataRules`

- Заменить side-effect агрегаторы явной композицией секций.
- Сохранить направленную иерархию конкретных слоёв.
- Передавать специальное поведение validation/import/sync/operations через
  узкие descriptors и нейтральный context runtime.
- Доказать эквивалентность существующими round-trip, schema, validation,
  import и sync тестами без изменения XML-фикстур.

### Этап 4. Ввести экземплярный runtime внутри `core`

- Добавить синхронный `createMetadataRuntime({ rules, workers })`.
- Сгруппировать API по возможностям.
- Перевести MCP на ленивый singleton runtime.
- Передать project state во владение runtime.
- Удалить регистрацию из `core/index.ts` и test setup.

### Этап 5. Перевести worker и сборку

- Создать rules-owned entrypoint без side effects.
- Создать обязательный worker manifest в MCP.
- Перевести MCP build с source paths на именованные package exports.
- Зафиксировать отсутствие автоматического повтора после аварии worker.

### Этап 6. Создать физические пакеты

- Создать private `packages/runtime` и `packages/rules`.
- Переносить законченные зоны отдельными `git mv`.
- Сначала переносить нейтральный код в runtime, затем конкретные definitions и
  adapters в rules; composition переносить последней.
- Распределить dependencies по фактическим production imports.
- Не открывать wildcard exports.

### Этап 7. Удалить `@nkdk/core`

- Перевести оставшихся потребителей на два новых пакета.
- Удалить старый фасад, register flags, global setup и aliases.
- Обновить архитектурные правила на package paths.
- Запретить runtime → rules для direct, type-only и transitive imports.
- Проверить отсутствие старых package imports и deep source paths.

## Тестовая архитектура

### Runtime

Runtime тестируется внутренними синтетическими definitions без публичного
`runtime/testing`:

- импорт пакета не меняет состояние;
- два runtime с одинаковыми ключами и разными обработчиками изолированы;
- поздний слой definition детерминированно заменяет ранний;
- массивы обработчиков сохраняют порядок композиции;
- read-only операции не регистрируют rules;
- project state нельзя использовать с другим runtime;
- `state.close()` и `runtime.close()` идемпотентны;
- авария worker не повторяет текущую операцию.

### Rules

Rules владеет проверками содержания:

- XML↔YAML round-trip на существующих фикстурах;
- JSON Schema;
- project/resource topology;
- validation и data path;
- import/sync/operations;
- интеграция `metadataRules` с настоящим runtime и worker.

XML-фикстуры не изменяются. Тесты не удаляются автоматически из-за переноса;
внутренние тесты объединяются только после появления равносильного граничного
теста согласно `.agents/testing.md`.

### Архитектура и сборка

Обязательные проверки:

- runtime не достигает rules;
- rules импортирует runtime только через разрешённые exports;
- обычные модули не достигают composition roots;
- public exports не содержат wildcard `internal`;
- MCP build не использует deep source paths соседних пакетов;
- package manifests содержат только фактические dependencies;
- dependency-cruiser показывает ноль нарушений и циклов без нового baseline.

После каждого законченного слоя выполняются целевые тесты и
`pnpm duplicates -- --base <base-commit>`. Перед завершением обязательны:

```text
pnpm type-check
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base <base-commit>
pnpm test
```

## Риски и ограничения

### Слишком широкий `rule-kit`

Rules может потребовать множество внутренних типов runtime. Новый export
добавляется только как устойчивый descriptor/builder, а не ради одного deep
import. `rule-kit` не раскрывает изменяемые registry implementations.

### Скрытое глобальное состояние

Удаления `registerCoreMetadata()` недостаточно. Критерий — два runtime с
пересекающимися ключами работают независимо без `clear...ForTests()`.

### Изменение порядка

Текущий порядок side-effect imports может влиять на поведение. Явная
композиция должна воспроизвести его: поздние одиночные записи заменяют ранние,
массивы сохраняют последовательность.

### Несогласованность main/worker

Дополнительного handshake нет. Риск ограничивается тем, что MCP собирает main
и все worker из одних package exports в одном build, а packed smoke-тест
запускает готовый результат.

### Размер изменения

Повторный перенос всего дерева одним коммитом запрещён. Каждый слой должен быть
собираемым, тестируемым и архитектурно чистым до следующего переноса.

## Точки остановки

Работа останавливается на границе слоя, если:

- runtime работает только после side-effect импорта rules;
- rules требует wildcard-доступа к runtime internals;
- категорию реестра нельзя перевести атомарно без двойной записи;
- package import создаёт цикл или архитектурное нарушение;
- продолжение требует изменить XML-фикстуру, добавить новое правило
  преобразования или новое применение `!xml`;
- полный test получает новое падение либо исходное падение нельзя отделить от
  изменений слоя.

Найденное ограничение сначала фиксируется и согласуется; спецификация не
исправляется постфактум под уже написанный код.

## Критерии завершения

- `packages/core` и `@nkdk/core` отсутствуют.
- Существуют private `@nkdk/runtime` и `@nkdk/rules` с зависимостью только
  `rules → runtime`.
- Импорт пакетов не запускает регистрацию и worker.
- MCP лениво создаёт один runtime через
  `createMetadataRuntime({ rules: metadataRules, workers })`.
- Все таблицы rules экземплярны и не используют process globals.
- Два runtime с разными definitions не видят данные друг друга.
- Rules не использует `@nkdk/runtime/internal/*` и deep source imports.
- Runtime не содержит конкретных imports и предметных условий.
- Worker явно загружает `metadataRules`; MCP собирает worker только через
  package exports.
- `runtime.close()` закрывает project state и worker pool.
- Dependency-cruiser показывает ноль нарушений и циклов без нового baseline.
- Все обязательные проверки проходят, новых дублей нет, XML-фикстуры не
  изменены.

## Вне границ работы

- Turborepo и удалённый кэш CI;
- динамические сторонние наборы rules и plugins;
- отдельная публикация и согласование версий rules/runtime;
- предварительная проверка полноты и ссылок в rules;
- `id`, `apiVersion`, `revision`, hash и worker handshake;
- публичный `@nkdk/runtime/testing`;
- новая иерархия типизированных ошибок;
- семантический анализатор конкретных строк и условий в runtime;
- исправление несвязанных тестов;
- изменение XML/YAML-семантики;
- новые правила преобразования и применения `!xml`;
- объединение worker ради производительности;
- совместимый фасад `@nkdk/core`.
