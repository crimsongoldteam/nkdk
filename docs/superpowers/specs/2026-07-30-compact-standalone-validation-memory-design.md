# Компактный standalone-модуль validation

## Цель

Сократить постоянную память validation worker и время загрузки standalone-модуля, не меняя результат проверки YAML и координаты диагностик.

## Границы

В постоянное решение входят:

- `verbose: false` при генерации Ajv standalone-кода;
- новый строгий functions-only формат `project-validation-ajv-standalone-v3`;
- удаление неиспользуемого legacy-договора `Schema()`/`Context()`;
- удаление неиспользуемых `schema` и `value` из нормализованных ошибок;
- регрессионные тесты структуры модуля, ошибок и диагностик.

В постоянное решение не входят:

- минификация standalone-кода;
- изменение `YamlLocationIndex` и механизма вычисления позиций диагностик;
- численный порог RSS в тестах;
- временный скрипт измерения standalone-import;
- временная вложенная точка профиля загрузки standalone в штатном worker.

Существующие посторонние изменения рабочей копии не относятся к этой задаче и должны быть сохранены без изменений.

## Формат standalone v3

Генератор создаёт модуль следующего вида:

```ts
{
  format: "project-validation-ajv-standalone-v3",
  form: {
    validate: ValidateFunction
  },
  byItemType: {
    [itemType: string]: {
      validate: ValidateFunction
    }
  }
}
```

Исходные `refs`, form schema, item schema и configuration context используются только во время сборки. В сгенерированный JavaScript они не сериализуются.

Формат `v3` намеренно несовместим с `v2`. Loader принимает только `v3`; поддержка старого внутреннего build-файла не требуется, поскольку generator и loader выпускаются вместе.

## Договор validation

`ValidationSchemaValidator` содержит только операции, используемые production validation:

```ts
interface ValidationSchemaValidator {
  Check(value: unknown): boolean
  Errors(value: unknown): [boolean, ValidationSchemaError[]]
}
```

Из интерфейса удаляются:

- типовой параметр схемы;
- `Schema()`;
- `Context()`.

Ajv- и TypeBox-реализации больше не экспортируют исходную схему и её context. `createValidationSchemaFromAjvFunction` принимает только готовую `ValidateFunction`. Standalone loader оборачивает функции без `Type.Any()` и других заглушек.

## Ошибки и позиции диагностик

Нормализованная ошибка сохраняет только данные, используемые для сообщения и позиции:

```ts
interface ValidationSchemaError {
  keyword: string
  schemaPath: string
  instancePath: string
  params: Record<string, unknown>
  message: string
}
```

Из `ValidationSchemaError` и `ValidationError` удаляются `schema` и `value`. `validateFile` больше не прикрепляет `parsed.data` к каждой ошибке.

Позиции диагностик продолжают вычисляться существующим путём:

1. Ajv возвращает `instancePath`.
2. `typeboxErrorsToDiagnostics` разбирает JSON Pointer в YAML-путь.
3. `ParsedYaml.locations` находит позицию ключа, значения или узла.
4. Итоговая `Diagnostic` получает `line`, `col` и `path`.

`YamlLocationIndex` не изменяется. Его построение является отдельным линейным проходом по YAML, но индекс используется также для пустых значений, кавычек, путей к данным и других диагностик. Оптимизация этого механизма требует отдельного измерения и дизайна.

## Генерация Ajv

Ajv standalone создаётся с:

```ts
{
  allErrors: false,
  inlineRefs: false,
  verbose: false
}
```

`verbose: false` исключает `schema`, `parentSchema` и `data` из Ajv errors и уменьшает объём сгенерированных литералов. `allErrors: false` сохраняет ранний выход после первой ошибки применимого правила.

## Проверка

Автоматические проверки должны подтверждать поведение, а не нестабильные численные показатели памяти:

- собранный модуль имеет формат `v3` и содержит только `format`, `form`, `byItemType`;
- form- и item-validator содержат только `validate`;
- Ajv error не содержит `schema`, `parentSchema` и `data`;
- functions-only loader выполняет `Check()` и `Errors()`;
- loader отклоняет формат, отличный от `v3`;
- существующие тесты JSON Pointer, `line`, `col` и `path` проходят без изменений;
- TypeScript type-check проходит;
- полный `pnpm test` проходит.

Перед удалением временной диагностики выполняется последний сравнительный замер. Численные результаты не становятся CI-порогом.

## Подтверждённый эффект прототипа

После `verbose: false`:

- standalone-файл: `21 450 621 → 17 711 900` байт, `−17,4%`.

После удаления сериализованных `refs` и `schema`:

- standalone-файл: `17 711 900 → 15 945 389` байт, `−10,0%`;
- RSS первого изолированного импорта: `+96,6 → +75,7` МиБ;
- медиана `heapUsed`: `+6,5 → +4,1` МиБ;
- медиана `external`: `+15,2 → +13,8` МиБ;
- медиана времени импорта: `105,1 → 92,1` мс.

Суммарно размер файла относительно исходного варианта уменьшился на `25,7%`.

RSS процесса является шумным показателем и общим для всех `worker_threads`. Структурные причины экономии защищаются тестами формата; численные изменения используются только для сравнительного профилирования.

## Удаление временной диагностики

После финального замера удаляются:

- `packages/core/scripts/measure-standalone-import-memory.mjs`;
- параметр `profiler` из `createProjectValidationWorkerSchemaCache`;
- вложенный шаг `Загрузка standalone`;
- передача profiler из `preparedYamlProjectWorker`.

Штатный общий профиль и существующий шаг `Инициализация validation worker` сохраняются.
