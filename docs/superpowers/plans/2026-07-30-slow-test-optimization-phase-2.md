# Slow Test Optimization Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разобрать 13 тестов с медианой больше 20 мс после первого этапа и удалить, объединить, ускорить либо обоснованно сохранить каждый из них.

**Architecture:** Тесты обрабатываются по общему production-маршруту: schema cache, атомарный индекс, полный applied-object sync, импорт форм и полный configuration sync. Для каждой группы сначала фиксируется mutation baseline и уникальный договор, затем выполняется минимальное изменение и повторное измерение.

**Tech Stack:** Node.js 26, TypeScript, Vitest 4, StrykerJS 9, pnpm.

## Global Constraints

- Исходный реестр: `docs/superpowers/test-performance/2026-07-30-core-slow-tests.json`.
- Профиль после первого этапа: `reports/test-profile/phase-1-after.json`.
- Решение принимается по медиане трёх последовательных прогонов.
- Существующие XML-фикстуры не изменяются.
- Fixture- и интеграционный тест сохраняется, если он защищает уникальную границу.
- Удаление или объединение не должно терять ранее обнаруживаемые мутанты.
- Mutation-отчёты с `Timeout`, `RuntimeError` или `CompileError` отклоняются.

## Целевая выборка

1. `projectValidationWorkerSchemaCache uses runtime schema cache for source TypeScript workers`.
2. `MetadataExchangePlan читает ExchangePlan из YAML и записывает XML`.
3. `ChildFormNames ... импортирует только страницы справки`.
4. `единая синхронизация внешних файлов applied objects восстанавливает модули и карту маршрута`.
5. `MetadataInformationRegister читает InformationRegister из YAML и записывает XML`.
6. `MetadataInformationRegister восстанавливает object-level модули`.
7. `configuration index file IO keeps the previous index ... when rename fails`.
8. `sync configuration from xml импортирует корневые XML из Ext`.
9. `ChildFormNames ... записывает Формы/<form>/Форма.yaml`.
10. `sync configuration from xml сохраняет простые корневые внешние файлы`.
11. `shared configuration index snapshot reads ... into shared memory`.
12. `ChildFormNames ... экспортирует ссылку ... локальным именем`.
13. `full XML sync failure integration сохраняет прежние байты снимка`.

---

### Task 1: Холодная сборка validation schema

**Files:**
- Modify: `docs/superpowers/test-performance/2026-07-30-core-slow-tests.json`
- Test: `packages/core/metadata/validation/projectValidationWorkerSchemaCache.test.ts`
- Production: `packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts`

- [ ] Запустить изолированный тест три раза с JSON-отчётами и подтвердить, что
  холодный вызов занимает больше 20 мс.
- [ ] Запустить baseline:

```bash
pnpm test:mutation -- --report schema-cache-before packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts
```

- [ ] Проверить договор: суффикс `.ts` выбирает runtime schema cache, а не
  standalone-модуль.
- [ ] Не добавлять глобальное кеширование: `ConfigurationContext` является
  входом функции, поэтому кеш между контекстами изменит production-семантику.
- [ ] Сохранить тест с решением `preserved` и причиной
  `Уникальный холодный договор выбора runtime schema cache`.
- [ ] Запустить целевой тест и зафиксировать mutation-результат в реестре.
- [ ] Создать коммит:

```bash
git commit -m "docs: :memo: обосновать холодный тест schema cache"
```

---

### Task 2: Атомарный configuration index

**Files:**
- Modify: `docs/superpowers/test-performance/2026-07-30-core-slow-tests.json`
- Test: `packages/core/metadata/configurationIndex/fileIO.test.ts`
- Test: `packages/core/metadata/configurationIndex/sharedSnapshot.test.ts`
- Production: `packages/core/metadata/configurationIndex/fileIO.ts`
- Production: `packages/core/metadata/configurationIndex/sharedSnapshot.ts`

- [ ] Запустить baseline отдельно для двух production-файлов.
- [ ] Подтвердить по тестам, что реальные `open/write/sync/rename/read` входят в
  наблюдаемый договор; не заменять их in-memory заглушкой.
- [ ] Проверить `killedBy` теста ошибки rename и теста shared snapshot.
- [ ] Если каждый тест обнаруживает уникальный мутант, сохранить оба с решением
  `preserved`.
- [ ] Если shared snapshot не обнаруживает уникальных мутантов
  `sharedSnapshot.ts`, объединить его утверждение с ближайшим тестом чтения и
  повторить mutation-сравнение.
- [ ] Запустить три изолированных прогона файлов и записать измерения.
- [ ] Создать коммит:

```bash
git commit -m "test: :white_check_mark: уточнить проверки атомарного индекса"
```

---

### Task 3: Полный applied-object sync

**Files:**
- Modify: `packages/core/tests/appliedObject/runSyncToXML.ts`
- Modify: четыре целевых applied-object теста из пунктов 2, 4, 5 и 6
- Modify: `docs/superpowers/test-performance/2026-07-30-core-slow-tests.json`
- Production: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`

- [ ] Запустить mutation baseline общего production-маршрута.
- [ ] Из `killedBy` выписать вклад каждого из четырёх целевых тестов.
- [ ] Для теста без уникального мутанта перечислить его fixture-договор:
  конкретный `rules.ts`, набор внешних файлов и формы.
- [ ] Сохранить полный fixture-тест, если он единственный проверяет конкретный
  `rules.ts`; иначе объединить дублирующие утверждения в существующий
  параметризованный тест.
- [ ] В `runSyncToXML.ts` читать result/expected для всех ожидаемых файлов через
  один `Promise.all`, не меняя канонизацию XML и существующие фикстуры.
- [ ] Запустить четыре файла три раза и сравнить медианы.
- [ ] Запустить mutation after и сравнение.
- [ ] Обновить четыре решения в реестре и создать коммит:

```bash
git commit -m "test: :zap: ускорить полную синхронизацию объектов"
```

---

### Task 4: Импорт дочерних форм

**Files:**
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts`
- Modify: `docs/superpowers/test-performance/2026-07-30-core-slow-tests.json`
- Production: `packages/core/metadata/importFromXml/importConfiguration.ts`

- [ ] Снять mutation baseline для production-маршрута импорта.
- [ ] Проверить уникальный договор каждого из трёх тестов: создание `Форма.yaml`,
  локализация ссылки и фильтрация страниц справки.
- [ ] Не объединять три разных договора в один тест.
- [ ] Вынести неизменяемую копию шести исходных fixture-файлов в один
  suite-scoped подготовленный каталог.
- [ ] Для каждого теста копировать только этот минимальный подготовленный
  каталог в отдельный временный input, сохраняя изоляцию изменений.
- [ ] Запустить файл три раза; принять изменение только при уменьшении медианы.
- [ ] Повторить mutation testing, обновить три решения и создать коммит:

```bash
git commit -m "test: :zap: ускорить импорт дочерних форм"
```

---

### Task 5: Configuration import и failure integration

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/failureIntegration.test.ts`
- Modify: `docs/superpowers/test-performance/2026-07-30-core-slow-tests.json`

- [ ] Снять отдельные mutation baseline по production-файлам, импортируемым
  двумя тестовыми файлами.
- [ ] Для двух `convertFromXML` тестов проверить пересечение создаваемых внешних
  файлов и `killedBy`.
- [ ] Объединить только одинаковую подготовку; оставить отдельные утверждения
  корневого XML и простых внешних файлов.
- [ ] Для failure integration сохранить реальные байты снимка и реальную
  файловую операцию: это уникальная граница отката.
- [ ] Запустить три прогона файлов и mutation after.
- [ ] Обновить три решения в реестре и создать коммит:

```bash
git commit -m "test: :zap: сократить подготовку configuration sync"
```

---

### Task 6: Проверка второй партии

**Files:**
- Modify: `docs/superpowers/test-performance/2026-07-30-core-slow-tests.json`

- [ ] Убедиться, что все 13 тестов имеют решение, причину и оставшийся договор.
- [ ] Выполнить:

```bash
pnpm test:profile -- --output reports/test-profile/phase-2-after.json
pnpm type-check
pnpm test
```

- [ ] Сравнить количество исходных тестов с решением `unreviewed` до и после.
- [ ] Следующую партию сформировать из оставшихся исходных тестов с медианой
  больше 10 мс, не добавляя случайные новые выбросы в исходную выборку.
