# Удаление старого validation worker и validation из metadata-операций

## Цель

Убрать переходную совместимость со старым validation worker и перестать запускать полную validation внутри операций `renameMetadataItem` и `findMetadataReferences`.

Это продолжает перевод YAML-проекта на общий шаг подготовки: validation остается отдельной операцией, а переименование и поиск ссылок работают с подготовленным YAML-проектом и текущим переходным построением `Metadata-модель`.

## Контекст

Полная validation проекта уже идет через `preparedYamlProjectWorker`. Старые файлы `projectValidationWorker.ts` и `projectValidationWorkerPool.ts` больше не являются целевой архитектурой, но пока остаются в коде как совместимость.

Операции `renameMetadataItem` и `findMetadataReferences` сейчас сначала вызывают `validateProject`, а затем снова вызывают `prepareYamlProject` для построения snapshot операции. Из-за этого YAML читается и разбирается дважды.

## Решение

### Старый validation worker

Удалить старый worker-путь:

- `packages/core/metadata/validation/projectValidationWorker.ts`;
- `packages/core/metadata/validation/projectValidationWorkerPool.ts`;
- тесты, которые проверяют этот старый путь;
- сборочные entrypoint'ы `projectValidationWorker.js` в core и MCP build;
- ожидания MCP-тестов, что publish build содержит `dist/projectValidationWorker.js`.

Оставить только общие части, которые используются новым prepared-worker путем:

- schema cache для validation worker, если он нужен `preparedYamlProjectWorker`;
- standalone AJV generation;
- loader/register модули, если они нужны для загрузки standalone-схем в worker.

### Metadata-операции

В `renameMetadataItem` и `findMetadataReferences` убрать предварительный вызов `validateProject`.

Операции должны:

1. создать контекст операции;
2. выполнить `prepareYamlProject`;
3. построить snapshot операции без требования полной validation;
4. разобрать operation path;
5. разрешить цель;
6. выполнить только свою прикладную логику.

`findMetadataReferences` не выполняет запись и не удаляет файлы. `renameMetadataItem` сохраняет прежний режим: без `allowWrite` возвращает план, с `allowWrite` применяет изменения.

## Не делаем сейчас

Не вводим общий helper вроде `prepareMetadataOperationContext`, потому что он закрепил бы переходную зависимость операций от `Metadata-модель`. Целевое направление проекта - постепенно уходить от модели, а не строить новую обертку вокруг нее.

Не переносим переименование и поиск ссылок на полностью индексный механизм в этой итерации. Это отдельный следующий шаг.

Не меняем single-file validation: `validateProject({ filePath })` может оставаться in-process, потому что это отдельный режим validation, а не старый full-project worker.

## Архитектура

В `.agents/architecture.md` для операций `Переименование` и `Поиск ссылок` нужно убрать флажки со шагов:

- `Проверка по схеме`;
- `Проверка зависимостей`.

Для этих операций остаются:

- `Подготовка YAML-проекта`;
- `Построение модели` как временный переходный шаг;
- для `Переименование` также `Запись YAML` и `Переименование путей`.

`Валидация` продолжает использовать `Подготовка YAML-проекта`, `Проверка по схеме`, `Построение модели` и `Проверка зависимостей`.

## Ошибки и поведение

После удаления встроенной validation операции больше не обязаны возвращать `validation_failed` при ошибках проекта, которые раньше находила полная validation.

Ошибки подготовки YAML-проекта остаются фатальными для операции:

- синтаксические ошибки YAML;
- ошибки чтения YAML;
- конфликты объявлений, обнаруженные подготовкой.

Ошибки построения snapshot операции остаются ошибками операции, но не считаются результатом полной validation проекта.

## Тестирование

Нужно обновить тесты операций:

- `renameMetadataItem` не должен возвращать `validation_failed` только из-за ошибок validation зависимостей;
- `findMetadataReferences` не должен возвращать `validation_failed` только из-за ошибок validation зависимостей;
- операции продолжают возвращать ошибки подготовки YAML-проекта при синтаксически некорректном YAML.

Нужно удалить или переписать тесты старого worker:

- тесты `projectValidationWorker`;
- тесты `projectValidationWorkerPool`;
- тесты publish output, ожидающие `dist/projectValidationWorker.js`.

Финальная проверка:

```bash
pnpm test
```

## Проверка согласованности

- Full validation проекта остается на `preparedYamlProjectWorker`.
- Старый `ProjectValidationWorkerPool` не остается переходной совместимостью.
- `renameMetadataItem` и `findMetadataReferences` больше не запускают полную validation.
- Спека не добавляет новый слой вокруг `Metadata-модель`.
- Архитектура явно показывает, что `Переименование` и `Поиск ссылок` пока не используют шаги validation.
