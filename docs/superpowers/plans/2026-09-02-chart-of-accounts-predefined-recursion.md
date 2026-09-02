# Рекурсивные предопределённые счета плана счетов — план реализации

> **Для Codex:** ОБЯЗАТЕЛЬНЫЙ НАВЫК: использовать `executing-plans-with-review`, а внутри него `superpowers:executing-plans`, чтобы выполнить план по задачам и провести независимую проверку соответствия.

**Цель:** Сохранять специфичные свойства плана счетов у вложенных предопределённых счетов, чтобы ERP round-trip обходился без широкого `!xml/raw` и XML-расхождений.

**Архитектура:** Ввести конкретный тип коллекции `ChartOfAccountsPredefinedItemCollection` и зарегистрировать его с `ChartOfAccountsPredefinedItemRules`. Этот тип используется корневой коллекцией `PredefinedData/Item` и рекурсивным свойством `ChildItems/Item`; общие правила предопределённых элементов и нейтральный runtime не меняются.

**Технологии:** TypeScript, Vitest, rule-kit, fast-xml-parser, JSON Schema, configuration index, скрипт `round-trip-yaml`.

**Базовая ревизия:** `c751974c86b5c4ee59206513ccc91a0685e6ff7c` (`origin/develop` после `git fetch origin develop`).

---

### Задача 1: Защитить рекурсивное XML → YAML → XML преобразование

**Файлы:**

- Создать: `packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined/roundTrip.integration.test.ts`
- Изменить: `packages/rules/metadata/appliedObjects/metadataChartOfAccounts/builders.ts`
- Изменить: `packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined/rules.ts`
- Изменить: `packages/rules/metadata/composition/staticFactoryRules.ts`

- [ ] **Шаг 1: Написать падающий регрессионный тест рекурсивного преобразования**

  Создать компактный inline XML-объект с верхним счётом `ОсновныеСредства` и вложенным счётом `ОСвОрганизации`. Во вложенном счёте явно задать `AccountType`, `OffBalance`, `Order`, `AccountingFlags` и `ExtDimensionTypes`. Преобразовывать реальными `ChartOfAccountsPredefinedRules` через `testPropertyFromXMLToYAML`, без моков и без чтения файловой системы.

  Проверить литеральные наблюдаемые значения:

  ```ts
  expect(imported.yaml).toMatchObject({
    items: {
      ОсновныеСредства: {
        Элементы: {
          ОСвОрганизации: {
            ВидСчета: "Активный",
            Забалансовый: "Истина",
            Порядок: "01.01",
            ПризнакиУчета: {
              "ChartOfAccounts.Хозрасчетный.AccountingFlag.Налоговый": {
                Значение: "Истина",
              },
            },
            ВидыСубконто: {
              "ChartOfCharacteristicTypes.ВидыСубконто.Номенклатура": {
                Оборотный: "Истина",
              },
            },
          },
        },
      },
    },
  })
  ```

  Затем экспортировать полученный YAML без `referenceXML`, сериализовать через `serializeDirectXML` и сравнить нормализованную структуру с исходным inline XML. Отдельно проверить, что у вложенного элемента нет `IsFolder`.

- [ ] **Шаг 2: Убедиться, что тест падает по причине прежнего общего правила**

  Выполнить:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/appliedObjects/metadataChartOfAccounts/predefined/roundTrip.integration.test.ts
  ```

  Ожидаемый результат: тест не находит специфичные поля во вложенном YAML и/или видит лишний `IsFolder=false`; это подтверждает исходный дефект, а не ошибку теста.

- [ ] **Шаг 3: Добавить построитель конкретной коллекции**

  В `builders.ts` добавить только конкретный тип свойства и его построитель по существующему образцу:

  ```ts
  export interface ChartOfAccountsPredefinedItemCollectionWidePropertyRule extends WidePropertyRuleBase {
    type: "ChartOfAccountsPredefinedItemCollection"
  }

  export type ChartOfAccountsPredefinedItemCollectionRuleParams = Omit<
    ChartOfAccountsPredefinedItemCollectionWidePropertyRule,
    "type"
  >

  export function chartOfAccountsPredefinedItemCollectionRule<
    const Params extends ChartOfAccountsPredefinedItemCollectionRuleParams,
  >(
    params: WideExactRuleParams<ChartOfAccountsPredefinedItemCollectionRuleParams, Params>
  ): Readonly<{ type: "ChartOfAccountsPredefinedItemCollection" } & Params> {
    return defineWidePropertyRule("ChartOfAccountsPredefinedItemCollection", params)
  }
  ```

  Общие `PropertyRule` и параметры других построителей не расширять.

- [ ] **Шаг 4: Переключить корневую и вложенную коллекции на конкретный тип**

  В `predefined/rules.ts` импортировать новый построитель. В `ChartOfAccountsPredefinedItemRules.properties` переопределить `childItems`, сохранив параметры общего правила и заменив только тип:

  ```ts
  childItems: chartOfAccountsPredefinedItemCollectionRule({
    xml: "ChildItems",
    yaml: "Элементы",
  }),
  ```

  В `ChartOfAccountsPredefinedRules.properties` аналогично заменить корневой `items`, сохранив его `xml`, `yaml`, `yamlInline` и прочие существующие параметры:

  ```ts
  items: chartOfAccountsPredefinedItemCollectionRule({
    xml: "Item",
    yamlInline: true,
    yaml: "items",
  }),
  ```

  После объявления `ChartOfAccountsPredefinedItemRules` зарегистрировать коллекцию:

  ```ts
  export const metadataRuleLayer002 = defineMetadataItemCollectionRule({
    propertyType: "ChartOfAccountsPredefinedItemCollection",
    itemRule: ChartOfAccountsPredefinedItemRules,
    xmlElement: "Item",
    keyField: "name",
    configurationIndexUidSegment: "Предопределенный",
  })
  ```

  В `staticFactoryRules.ts` подключить `metadataRuleLayer002` рядом с двумя существующими слоями этого модуля и сдвинуть последующие номера `contribution` согласованно во всём файле.

- [ ] **Шаг 5: Получить зелёный регрессионный тест**

  Повторить целевую команду Vitest. Ожидаемый результат: вложенный YAML содержит все пять групп свойств, экспорт не создаёт `IsFolder`, нормализованные XML-структуры равны.

- [ ] **Шаг 6: Проверить типы и новые дубли первого слоя**

  Выполнить:

  ```bash
  pnpm --filter @nkdk/rules exec tsc --noEmit
  pnpm duplicates -- --base c751974c86b5c4ee59206513ccc91a0685e6ff7c
  ```

  Исправить только ошибки, относящиеся к этому слою, не меняя общий runtime.

- [ ] **Шаг 7: Зафиксировать слой**

  ```bash
  git add packages/rules/metadata/appliedObjects/metadataChartOfAccounts/builders.ts \
    packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined/rules.ts \
    packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined/roundTrip.integration.test.ts \
    packages/rules/metadata/composition/staticFactoryRules.ts
  git commit -m "fix: :bug: сохранить свойства вложенных предопределённых счетов"
  ```

### Задача 2: Защитить индекс конфигурации и рекурсивную JSON Schema

**Файлы:**

- Изменить: `packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined/roundTrip.integration.test.ts`

- [ ] **Шаг 1: Добавить падающую проверку logicalAddress вложенного счёта**

  В существующий регрессионный тест передать импорт-контекст через `withConfigurationIndexCollector`, начав с адреса `ChartOfAccounts.Хозрасчетный.Predefined`. У обоих inline элементов задать фиксированные UUID и проверить, что вложенный UUID записан с прежним сегментом:

  ```ts
  expect(index.fragment("ПланСчетов/Хозрасчетный/Свойства.yaml").entities).toContainEqual({
    logicalAddress:
      "ChartOfAccounts.Хозрасчетный.Predefined.Предопределенный.ОсновныеСредства.Предопределенный.ОСвОрганизации",
    uuid: "22222222-2222-4222-8222-222222222222",
  })
  ```

  Эта проверка фиксирует сохранение прежнего адресного договора при замене типа коллекции; исходная общая коллекция использует тот же сегмент.

- [ ] **Шаг 2: Получить зелёную проверку индекса на уже введённой коллекции**

  Если тест выявит отличие фактического прежнего адреса от зафиксированного в спецификации, исследовать существующий договор индекса и исправить только параметры конкретной регистрации. Не добавлять специальные условия в сборщик индекса.

- [ ] **Шаг 3: Добавить проверку рекурсивной JSON Schema**

  Экспортировать граф именованных JSON Schema для `ChartOfAccountsPredefinedItemRules` реальным реестром композиции и скомпилировать корневую схему вместе с зависимостями. Проверить, что схема принимает вложенный счёт со специфичными полями и отклоняет недопустимое значение специфичного поля:

  ```ts
  expect(check.Check({
    Код: "01",
    Наименование: "Основные средства",
    Элементы: {
      ОСвОрганизации: {
        Код: "01.01",
        Наименование: "Основные средства организации",
        ВидСчета: "Активный",
        Забалансовый: "Истина",
      },
    },
  })).toBe(true)
  expect(check.Check({
    Код: "01",
    Наименование: "Основные средства",
    Элементы: {
      ОСвОрганизации: {
        Код: "01.01",
        Наименование: "Основные средства организации",
        Забалансовый: "не булево",
      },
    },
  })).toBe(false)
  ```

  Этот тест защищает выбор `ChartOfAccountsPredefinedItemRules` на рекурсивной границе, а не внутреннее устройство реестра.

- [ ] **Шаг 4: Запустить целевой файл и соседние тесты**

  Выполнить:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/appliedObjects/metadataChartOfAccounts/predefined/roundTrip.integration.test.ts
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/appliedObjects/metadataChartOfAccounts/predefined/rules.test.ts metadata/ruleRuntime/metadataItem/ruleFactory.test.ts
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/ruleRuntime/property/canonicalXMLDefaults.test.ts
  pnpm duplicates -- --base c751974c86b5c4ee59206513ccc91a0685e6ff7c
  ```

- [ ] **Шаг 5: Зафиксировать проверки договора**

  ```bash
  git add packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined/roundTrip.integration.test.ts
  git commit -m "test: :white_check_mark: защитить рекурсию предопределённых счетов"
  ```

### Задача 3: Проверить настоящую ERP и весь репозиторий

**Файлы:**

- Проверить: чистая временная копия `/Users/nikita/git/round-trip-compact/cf/erp`
- Проверить: YAML и отчёты, созданные `round-trip-yaml` во временной копии

- [ ] **Шаг 1: Подготовить чистый временный worktree XML-репозитория**

  Не изменять и не сбрасывать пользовательский `/Users/nikita/git/round-trip-compact`. Узнать его текущий HEAD и создать отдельный worktree, например:

  ```bash
  git -C /Users/nikita/git/round-trip-compact worktree add --detach \
    /private/tmp/round-trip-compact-erp-predefined HEAD
  ```

- [ ] **Шаг 2: Запустить полный ERP round-trip настоящим MCP**

  Из worktree NKDK выполнить:

  ```bash
  env NKDK_XML_REPO=/private/tmp/round-trip-compact-erp-predefined \
    NKDK_XML_DIR=/private/tmp/round-trip-compact-erp-predefined/cf/erp \
    ./.agents/skills/round-trip-yaml/round-trip.sh
  ```

  Дождаться полного завершения. Проверить итоговый счётчик расхождений, список ошибок и предупреждений, а не только код завершения скрипта.

- [ ] **Шаг 3: Проверить критерии ERP**

  Подтвердить по созданному YAML и отчётам:

  - `ПланСчетов/Хозрасчетный/Свойства.yaml` не содержит широкого `Предопределенные: !xml/raw`;
  - предупреждение `xml_raw_scope_too_broad` отсутствует;
  - XML-расхождений нет;
  - возможные три ранее известные `unresolved_data_path` перечислены отдельно и не приписываются этой доработке.

- [ ] **Шаг 4: Выполнить обязательные проверки репозитория**

  Выполнить свежими полными прогонами:

  ```bash
  pnpm type-check
  pnpm duplicates -- --base c751974c86b5c4ee59206513ccc91a0685e6ff7c
  pnpm test:architecture:rules
  pnpm test:architecture
  pnpm test
  git diff --check
  git status --short
  ```

  Любое падение исследовать и исправить в границах спецификации, затем повторить затронутые и полные проверки.

- [ ] **Шаг 5: Независимая проверка соответствия**

  Передать независимому проверяющему спецификацию, этот план, базовую ревизию и полный diff. Проверяющий не изменяет файлы и возвращает только замечания с уровнем критичности и итог `APPROVED` либо `CHANGES REQUESTED`. Все существенные замечания исправить, повторить затронутые проверки и запросить повторную проверку у того же проверяющего.

- [ ] **Шаг 6: Итоговая проверка после одобрения**

  Повторно выполнить минимальный набор команд, доказывающий исправленное поведение и отсутствие незакоммиченных изменений. Если после одобрения изменился хотя бы один файл, снова передать итоговый diff тому же проверяющему.
