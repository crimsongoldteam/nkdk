# Rust ProjectState Warm Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить повторный расчёт ключей и второй typed reader, затем измерить холодный и прогретый Rust worker отдельно.

**Architecture:** `openRustProjectStateReadSession` создаёт один typed reader и передаёт его резервному порту, а ключи запросов вычисляет один раз на пачку. Измеритель выполняет два одинаковых раунда на одном Piscina pool с новыми read token, возвращая раздельные времена.

**Tech Stack:** TypeScript 7, Vitest 4, Piscina, napi-rs 3.12.1, `SharedArrayBuffer`.

## Global Constraints

- Публичный `ProjectStateQueryPort`, `ProjectStateReadToken` и формат `project-state.bin 0.5.0` не меняются.
- Прогретый раунд получает новую read session с пустым кэшем запросов.
- Корректность cold/warm результатов должна совпадать.
- Все изменения поведения реализуются через RED–GREEN.

---

### Task 1: Один ключ и один typed reader

**Files:**
- Modify: `packages/rules/metadata/projectState/rust/readSession.test.ts`
- Modify: `packages/rules/metadata/projectState/rust/readSession.ts`

**Interfaces:**
- Consumes: существующие `createTypedProjectStateReader`, `createBinaryProjectStateQueryPort` и `targetCacheKey`.
- Produces: необязательные внутренние зависимости `createTypedReader`, `createFallbackQueryPort`, `createTargetCacheKey`.

- [ ] Добавить тест, который передаёт счётчики трёх фабрик, выполняет пачку из двух одинаковых запросов и повторную пачку, затем ожидает один typed reader, тот же экземпляр в fallback и три расчёта ключа.

```ts
expect(typedReaderCalls).toBe(1)
expect(fallbackTypedReader).toBe(createdTypedReader)
expect(cacheKeyCalls).toBe(3)
```

- [ ] Запустить `pnpm --filter @nkdk/rules exec vitest run metadata/projectState/rust/readSession.test.ts` и подтвердить RED: зависимости ещё игнорируются либо ключ вызывается дважды.
- [ ] Создать typed reader до fallback, передать его через параметр `typedReader`, сохранить ключи пачки в `string[]` и использовать повторно при формировании ответа.

```ts
const keys = requests.map(({ componentPath, canonicalTarget }) =>
  createTargetCacheKey(componentPath, canonicalTarget))
return requests.map(({ requestId }, index) => ({ requestId, ...cache.get(keys[index]!)! }))
```

- [ ] Повторить тест и `pnpm --filter @nkdk/rules type-check`; ожидать GREEN.
- [ ] Запустить `pnpm duplicates -- --base 4392598c4` и создать коммит `perf: :zap: сократить работу Rust read session`.

### Task 2: Два раунда на одном worker pool

**Files:**
- Modify: `packages/rules/scripts/measure-binary-project-state-worker.ts`
- Modify: `packages/rules/scripts/measure-binary-project-state.ts`
- Modify: `packages/rules/scripts/measure-project-state-backend-worker.ts`
- Modify: `packages/rules/scripts/measure-project-state-backends.test.ts`

**Interfaces:**
- Consumes: `ProjectStateSharedBuffers`, `createBinaryProjectStateReadToken`, существующий `run` Piscina.
- Produces: `seconds.coldLookup`, `seconds.warmLookup`, а в `ProjectStateBackendRun` — `coldLookupMs`, `warmLookupMs`.

- [ ] Изменить тест измерителя: зависимость `measure` возвращает два времени, а ожидаемый результат содержит оба значения в миллисекундах.

```ts
seconds: { read: 0.01, write: 0.02, coldLookup: 0.2, warmLookup: 0.15 }
// expected
coldLookupMs: 200,
warmLookupMs: 150,
```

- [ ] Запустить `pnpm --filter @nkdk/rules exec vitest run scripts/measure-project-state-backends.test.ts` и подтвердить RED из-за отсутствующих полей.
- [ ] В `measureBinaryProjectState` вынести один запуск четырёх задач в локальную функцию, выполнить её дважды на том же pool и проверить равенство found/missing.

```ts
const cold = await runLookupRound()
const warm = await runLookupRound()
if (cold.found !== warm.found || cold.missing !== warm.missing) {
  throw new Error("Холодный и прогретый раунды ProjectState различаются")
}
```

- [ ] Для второго раунда создавать новые одноразовые read token над теми же `SharedArrayBuffer`; worker-код и семантика одного раунда не меняются.
- [ ] Передать раздельные времена в результат backend worker, повторить тесты и type-check до GREEN.
- [ ] Запустить проверку дублей и создать коммит `perf: :zap: измерять прогретый ProjectState worker`.

### Task 3: Замеры и полная проверка

**Files:**
- Verify only: весь worktree и временный проект `/private/tmp/nkdk-rust-query-project`.

**Interfaces:**
- Consumes: CLI `measure-project-state-backends.ts` и сохранённый снимок 706594 байта.
- Produces: медианы пяти прогонов cold/warm time и RSS для repeated/unique.

- [ ] Собрать native-пакет и выполнить по пять прогонов обоих вариантов для `repeated` и `unique`, `--lookups 200000 --concurrency 4`.
- [ ] Проверить одинаковые found/missing и digest; рассчитать медианы `coldLookupMs`, `warmLookupMs` и RSS.
- [ ] Запустить cargo fmt/clippy, native tests, `pnpm type-check`, архитектурные проверки, дублирование и полный `pnpm test`.
- [ ] Проверить чистое дерево и сообщить, достигнут ли паритет на прогретой повторяющейся нагрузке.
