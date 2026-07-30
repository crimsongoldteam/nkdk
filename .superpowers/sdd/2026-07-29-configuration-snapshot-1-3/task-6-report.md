# Task 6: временные индексы и профиль расширения

## Результат

- `readComponentIndexes` больше не принимает `snapshot` и всегда холодно
  вычисляет `metadata`, `dependencies` и `logicalAddresses` по текущей
  топологии и YAML.
- `ConfirmedComponentState.snapshot` сохранён отдельно только для идентичностей
  и XML-представления; текущий логический адрес не обязан иметь `entity` в
  снимке.
- `ComponentIndexes.dependencies` переведён с удалённого persisted-типа на
  временный `ProjectLocalDependency`.
- Профиль расширения строит множества адресов только из текущих
  `ComponentIndexes`, а UUID читает через
  `reader.entity(logicalAddress)?.identities?.uuid`.
- Корень расширения получает UUID основной конфигурации только при
  `entity.xml.extended === true`.
- Удалены `extensionPropertyOrders`, `snapshotMarksAdopted`,
  `snapshotHasExtendedConfigurationObject`,
  `EXTENSION_PROPERTY_ORDER_SEGMENT`, `EXTENSION_INTERNAL_INFO_SEGMENT` и все
  extension-specific `present/order` записи.
- Служебные XML-свойства формируются по текущему профилю, rules и `Контроль`;
  порядок берётся из скомпилированного `xmlOrder`, а из снимка переносится
  только содержательный `xml.extended`.

## RED

1. Холодное вычисление индексов:

   ```text
   pnpm exec vitest run --no-isolate \
     metadata/project/componentState/indexes.test.ts

   FAIL: expected createWorkerPool to be called once, got 0
   ```

2. Отдельный snapshot в подтверждённом состоянии:

   ```text
   pnpm exec vitest run --no-isolate \
     metadata/project/componentState/confirm.test.ts

   2 failed: reader.binding is not a function
   ```

3. Текущие адреса и reader 1.3 в профиле расширения:

   ```text
   pnpm exec vitest run --no-isolate \
     metadata/fullSyncToXml/profiles/configurationExtension.test.ts

   7 failed: reader.xmlNodes is not a function
   ```

4. Отказ от `present/order` при XML → YAML:

   ```text
   pnpm exec vitest run --no-isolate \
     metadata/appliedObjects/configurationExtension/propertyStates.test.ts

   12 failed: setPresent/setExtended отсутствуют у collector 1.3
   ```

5. Rules/YAML/control при YAML → XML:

   ```text
   pnpm exec vitest run --no-isolate \
     metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts

   10 failed: старый extensionPropertyOrder обращался к удалённым данным
   снимка
   ```

6. Дополнительные циклы TDD зафиксировали:

   - служебные свойства заимствованной формы без persisted-маркеров;
   - перенос `xml.extended` корня в следующий снимок.

## GREEN

```text
pnpm exec vitest run --no-isolate \
  metadata/project/componentState \
  metadata/fullSyncToXml/profiles/configurationExtension.test.ts \
  metadata/appliedObjects/configurationExtension/propertyStates.test.ts \
  metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts

Test Files  7 passed (7)
Tests       41 passed (41)
```

Команды вида `pnpm --filter @nkdk/core test -- <paths>` из brief передают пути
после собственного `--` скрипта и фактически запускают весь пакет. Для
однозначной целевой проверки использован прямой Vitest выше.

## TypeScript

```text
pnpm exec tsc --noEmit --pretty false
exit code: 2
changed_error_count: 0
```

Фильтр по файлам Task 6 не нашёл ошибок TypeScript. Общий type-check ожидаемо
остаётся красным на немигрированных API Tasks 7–8.

## Изменённые файлы

- `packages/core/metadata/project/componentState/indexes.ts`
- `packages/core/metadata/project/componentState/indexes.test.ts`
- `packages/core/metadata/project/componentState/types.ts`
- `packages/core/metadata/project/componentState/confirm.ts`
- `packages/core/metadata/project/componentState/confirm.test.ts`
- `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts`
- `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- `packages/core/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- `packages/core/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- `packages/core/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- `packages/core/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`

`syncConfiguration.ts` изменён только для прекращения передачи `snapshot` в
`readComponentIndexes`.

## Самопроверка и замечания

- `git diff --check` — без ошибок.
- Запрещённые extension-маркеры и старые `xmlNode/xmlValue` обращения в файлах
  Task 6 отсутствуют.
- XML-фикстуры не изменялись.
- Существующий untracked
  `packages/core/metadata/appliedObjects/configuration/__fixtures__/_partial_xml_tmp/`
  не изменялся и не включён в коммит.
- Расширенный запуск всего каталога
  `metadata/appliedObjects/configurationExtension` дал 47/48: единственное
  падение `rules.test.ts` обращается к старому `collector.setUuid` в общем
  `internalInfo/configurationIndex.ts`. Это миграция Tasks 7–8 и находится вне
  Task 6.

## Fix round 1

- Регрессионный тест на реальном `MetadataCatalogRules` подтвердил, что
  `ExtendedConfigurationObject` оставался после `Synonym`, потому что свойство
  отсутствовало в `rules.ts`.
- Служебное runtime-only свойство и его место после `name` объявлены в
  `MetadataCatalogRules`; порядок больше не восстанавливается из снимка.
- Удалено неиспользуемое поле
  `indexedPropertyOrderByLogicalAddress` из профиля worker, контекста и передачи
  в worker.
- RED: 1 из 11 тестов упал на порядке
  `ObjectBelonging, Name, Synonym, ExtendedConfigurationObject`.
- GREEN: целевой набор Task 6 — 7 файлов, 42 теста успешно.
- Общий `tsc --noEmit` остаётся красным на Tasks 7–8; в изменённых файлах ошибок
  TypeScript нет.
