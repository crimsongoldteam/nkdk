# Task 3 — JSON Schema корня расширения

## Изменения

- `ValidationSchemaCache.properties()` теперь принимает `MetadataItemRule` и адресует runtime-кэш по `rule.itemType`.
- Первый проход использует `file.owner.spec.rule`.
- В runtime и standalone-набор добавлен уникальный список root-rules, включая `configurationExtension` из зарегистрированного component descriptor.
- Корневое правило расширения зарегистрировано как JSON Schema exporter, поэтому граф может разрешить `MetadataConfigurationExtension`.
- Standalone-договор обновлён до `project-validation-ajv-standalone-v2` и `byItemType`; генератор и loader используют этот ключ.

## TDD

### RED

Команда:

```sh
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/projectValidationPasses.test.ts \
  metadata/validation/projectValidationStandaloneLoader.test.ts
```

Добавленный тест передавал `MetadataConfigurationExtensionRules` напрямую в schema cache и проверял, что YAML расширения не проходит схему основной конфигурации.

Результат: `1 failed, 12 passed`; ожидаемое падение — `TypeError: Cannot read properties of undefined (reading 'itemType')` в старом пути `spec.rule.itemType`.

### GREEN

Команда:

```sh
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/projectValidationPasses.test.ts \
  metadata/validation/projectValidationStandaloneBuild.test.ts \
  metadata/validation/projectValidationStandaloneLoader.test.ts \
  metadata/validation/projectValidationWorkerSchemaCache.test.ts
```

Результат: `4 passed`, `19 passed`.

После сборки дополнительно выполнено:

```sh
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationStandaloneBuild.test.ts
```

Результат: `1 passed`, `5 passed`; тест импортировал сгенерированный `dist/projectValidationAjvStandalone.js` и подтвердил формат v2 и validator `MetadataConfigurationExtension`.

## Проверки

- `pnpm --filter @nkdk/core build` — успешно.
- `git diff --check` — успешно.
- Поиск старых `byProjectDir` и `project-validation-ajv-standalone-v1` в validation-исходниках не нашёл результатов.
- Самопроверка: тест схемы ломается при возврате к address-key `dir` или при выборе основной схемы для extension YAML; loader-тест ломается при исключении root-rule расширения из `compileAll`.

## Файлы

- `packages/core/metadata/appliedObjects/configurationExtension/register.ts`
- `packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts`
- `packages/core/metadata/validation/projectValidationPasses.ts`
- `packages/core/metadata/validation/projectValidationStandaloneSchemas.ts`
- `packages/core/metadata/validation/projectValidationStandaloneTypes.ts`
- `packages/core/metadata/validation/projectValidationStandaloneLoader.ts`
- Четыре соответствующих test-файла validation.

## Риски

Полный `pnpm test` был запущен дважды и оба раза core не выдавал результатов после старта более 120 секунд; последняя интерактивная сессия остановлена вручную с exit code 130 по указанию координатора. Focused-тесты, повторный build-тест с generated standalone и сборка core прошли.
