# Validation Unified Shared Snapshot Design

## Цель

Сделать binary shared snapshot единственным механизмом second pass validation для full, partial и одиночной валидации.

Ветка уже проверила две гипотезы:

- JSON owner snapshot корректен, но медленнее: `real 38.70s`, `secondPassWall 7153.38ms`, `sharedOwnerBytes 129265248`.
- Binary owner snapshot корректен и быстрее: `real 34.24s`, `secondPassWall 2949.51ms`, `sharedOwnerBytes 96521618`.

Значит JSON и legacy objectTable supplement больше не нужны как поддерживаемые пути.

## Архитектурный принцип

Общий validation/orchestration слой не знает о конкретных metadata-объектах, папках, XML-корнях, формах, планах счетов, константах или других applied-реализациях.

Единый механизм работает только с нейтральными договорами:

- `ValidationObjectTableSnapshot`;
- `SharedValidationSnapshot`;
- `OwnerMetadataCache`;
- `ProjectReferenceIndex`;
- зарегистрированные extension points, которые уже умеют интерпретировать `OwnerMetadata`.

Если прикладной код требует особую логику, она остаётся в регистрациях и resolver-ах applied-слоя. Shared snapshot только переносит нейтральные данные owner/reference между фазами validation.

## Что Удаляем

Удаляем экспериментальные развилки:

- `JsonSharedOwnersSnapshot`;
- `SharedValidationOwnerRecord`;
- `SharedObjectFieldIndex`;
- `SharedObjectField`;
- `SharedObjectFieldTableSource`;
- `createJsonSharedOwnersSnapshot`;
- `decodeSharedValidationOwners`;
- `decodeObjectFieldIndex`;
- флаг `NKDK_VALIDATION_SHARED_OWNER_FORMAT`;
- флаг `NKDK_VALIDATION_SHARED_SECOND_PASS`;
- legacy objectTable supplement в worker second pass;
- тесты, которые проверяют выбор `json|binary`;
- документацию про JSON fallback.

Также убираем профильное поле `ownerFormat`: формат становится один, поэтому оно больше не несёт диагностической пользы.

## Что Оставляем

Оставляем и делаем штатным путём:

- `SharedStringPool`;
- binary shared owner snapshot;
- shared reference index;
- lazy owner lookup через `OwnerMetadataCache`;
- перенос `owner.model` как нейтральных данных owner-записи, потому что существующие extension points читают `OwnerMetadata.model`;
- профильные метрики `sharedOwnerBytes`, `sharedSnapshotBytes`, `snapshot`, `workerWall`, `secondPassWall`.

## Единый Snapshot Provider

Вводим небольшой нейтральный слой, условно `ValidationSnapshotProvider`.

Он строится из `ValidationObjectTableSnapshot` и предоставляет:

```ts
interface ValidationSnapshotProvider {
  ownerCache(projectDir: string): OwnerMetadataCache
  referenceIndex(params: {
    projectDir: string
    mode: ValidationMode
    resolveObjectFilePath: ResolveObjectFilePath
    resolveProjectFile?: ResolveProjectFileDependency
  }): ProjectReferenceIndex
  sharedPayload(): SharedValidationSnapshot
}
```

Название можно уточнить при реализации, но ответственность должна остаться такой:

- создание shared owner snapshot;
- создание shared reference snapshot;
- создание cache/index поверх этих snapshot;
- отсутствие знаний о конкретных metadata item types.

## Full Validation

Full validation с worker-ами:

1. Worker-ы выполняют first pass и возвращают нейтральные records/index entries.
2. Главный поток собирает `ValidationObjectTableSnapshot`.
3. Главный поток создаёт единый `ValidationSnapshotProvider`.
4. Worker-ы получают `SharedValidationSnapshot`.
5. Worker second pass всегда использует shared owner cache и shared reference index.

Legacy supplement больше не создаётся и не передаётся.

## Partial И Одиночная Validation

Partial/одиночная validation не должна оставаться отдельным логическим механизмом.

Она может выполняться in-process, но должна использовать те же фабрики:

1. first pass наполняет `ValidationObjectTable`;
2. после каждого обновления зависимостей создаётся snapshot provider из текущей таблицы;
3. second pass получает owner cache и reference index из provider;
4. если reference index возвращает `needsDependency`, очередь догружает зависимость, таблица обновляется, provider пересоздаётся.

Так full и partial различаются только способом исполнения и очередью зависимостей, а не структурой индексов.

## Ошибки И Dependencies

Поведение partial mode сохраняется:

- если ссылка ведёт на объект, который можно найти как файл проекта, reference index возвращает `needsDependency`;
- очередь добавляет файл;
- first pass импортирует зависимость;
- second pass повторяется на обновлённом snapshot.

Shared reference index должен сохранять этот режим. Если текущая shared-реализация уже принимает `mode: "full" | "partial"` и `resolveProjectFile`, её нужно использовать напрямую. Если нет, доработать общий договор без знания конкретных объектов.

## Тесты

Минимальный набор проверок:

- binary owner snapshot восстанавливает fields, aliases, table source columns и `owner.model`;
- `validateProject` с full worker validation проходит без `NKDK_VALIDATION_SHARED_SECOND_PASS`;
- `validateProject` с одиночным `filePath` использует тот же snapshot/cache путь и сохраняет dependency enqueue поведение;
- JSON format selection tests удалены;
- worker second pass tests проверяют отсутствие objectTable supplement;
- полный `/Users/nikita/git/nkdk-yaml` даёт `0 error, 0 warning`;
- `pnpm test` проходит полностью.

## Документация

Обновить старые design/plan-файлы, если они описывают JSON fallback как поддерживаемый путь.

Исторические замеры можно оставить как контекст, но текущий целевой дизайн должен быть однозначным:

- owner snapshot формат один: binary;
- shared second pass не флаг, а штатный путь;
- legacy supplement не поддерживается.

## Критерий Готовности

Работа считается завершённой, когда:

- в коде нет JSON owner snapshot пути;
- нет `NKDK_VALIDATION_SHARED_OWNER_FORMAT`;
- нет `NKDK_VALIDATION_SHARED_SECOND_PASS`;
- worker и in-process validation используют общий snapshot/cache механизм;
- full и partial validation остаются корректными;
- общий слой не содержит условий по конкретным applied-объектам;
- `/Users/nikita/git/nkdk-yaml` проходит с `0 error, 0 warning`;
- `pnpm test` зелёный.
