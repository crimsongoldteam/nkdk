# Validation Shared Second Pass Design

## Цель

Полностью убрать передачу больших JS-объектов проекта во `second pass` worker-ов full validation.

Опытный `SharedArrayBuffer` для reference index уже показал направление: snapshot ссылок уменьшился с `290836932` до `34543344` байт, а `secondPassWall` снизился примерно с `9.48s` до `7.07s`. Следующий шаг — перевести оставшийся `objectTable` / `ownerCache` supplement в тот же read-only shared-подход.

## Границы

В shared-представление переводится только full validation `second pass`.

Не переводим:

- parsed YAML;
- состояния `ProjectValidationFileState`;
- результаты first pass форм;
- partial validation dependency flow.

Эти данные либо уже локальны в worker-е, либо требуют отдельной модели зависимостей.

## Архитектура

Добавляется единый `SharedValidationSnapshot`, который строится после first pass в основном потоке и передаётся worker-ам как набор `SharedArrayBuffer` descriptor-ов.

Секции snapshot:

- `strings`: общий словарь UTF-8 строк;
- `references`: compact reference index для `object`, `member`, `value`;
- `owners`: lookup `OwnerTypeRef -> owner record`;
- `fields`: поля владельцев, табличные части, колонки и минимальный `typeInfo`;
- `files`: lookup абсолютных путей файлов для `hasFile`;
- `stats`: размеры, количество записей, конфликты.

Worker во `second pass` получает:

- `sharedValidationSnapshot`;
- свою часть `pendingReferences`;
- список своих `filePaths`;
- локальные first-pass states.

Worker больше не получает `objectTable` supplement и не собирает `createValidationObjectTable({ records, filePaths })` для удалённых владельцев.

## Owner Cache

Новая реализация `OwnerMetadataCache`:

```ts
createOwnerMetadataCacheFromSharedValidationSnapshot({
  projectDir,
  snapshot,
})
```

Она возвращает `OwnerMetadataResult` по тому же договору, что текущий cache, но данные берёт из shared-секций:

- `ref`;
- `filePath`;
- `fieldIndex`;
- `rule/spec` восстанавливаются через существующие регистрации `dataPath/registry`.

Полный `model` не хранится. Для `resolveDataPath` нужен в первую очередь `fieldIndex`, а специальные переходы должны работать через rule/spec/registry, а не через полный объект модели. Если будет найдено место, которому реально нужен `model`, для него вводится явный минимальный shared-представитель вместо возврата полного импортированного объекта.

## Field Index

`ObjectFieldIndex` переводится в компактные таблицы:

- owner id;
- field name id;
- target name id;
- field kind;
- type flags;
- source text id;
- defined type flags/count;
- table source offset;
- columns range.

Цель — поддержать операции, которые нужны `resolveDataPath`:

- поиск поля по сегменту;
- поиск стандартного alias;
- переход в табличную часть;
- получение typeInfo поля/колонки.

## Совместимость

Старый JS-путь остаётся временным fallback-ом:

- для partial validation;
- при `NKDK_VALIDATION_SHARED_SECOND_PASS=0`;
- для диагностики расхождений на время внедрения.

После подтверждения профилем и тестами fallback можно удалить отдельным шагом.

## Ошибки и диагностика

Shared cache должен выдавать те же типы результатов:

- `ok`;
- `not-found`;
- `import-error`;
- `ambiguous`.

Для full validation import errors и ambiguous owners уже известны после first pass, поэтому shared owner record хранит compact status и ссылку на диагностические данные, достаточные для прежнего сообщения.

## Проверка

Минимальные проверки:

- unit-тесты shared owner/field lookup против текущего `createOwnerMetadataCacheFromValidationTable`;
- regression-тесты `resolveDataPath` на реквизиты, табличные части, колонки, определяемые типы и регистры движений;
- full validation `/Users/nikita/git/nkdk-yaml` с `0 error, 0 warning`;
- сравнение профиля shared и fallback:
  - `secondPassWall`;
  - размер shared snapshot;
  - `contextMs`;
  - `referenceValidationMs`;
  - `validationMs`;
  - `real/user/sys`.

## Ожидаемый результат

После полного перевода во `second pass` worker-ы не копируют ни reference index, ни `objectTable` supplement. Память должна снизиться сильнее, чем в первом прототипе, а `secondPassWall` должен приблизиться к сумме реальной проверки ссылок, построения owner cache и валидации форм без стоимости structured clone больших JS-объектов.
