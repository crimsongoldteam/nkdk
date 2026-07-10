# Кэш контекста discriminated-union ошибок validation

## Контекст

Полная validation большого YAML-проекта сейчас однопоточная и упирается в CPU. Разовая диагностика `/Users/nikita/git/nkdk-yaml` показала, что главный горячий участок находится не в DataPath и не в импорте модели, а в генерации подробных TypeBox-ошибок для discriminated union.

Самая дорогая операция — повторный вызов `collectSchemaReferences(schema.Schema(), schema.References())` в `expandDiscriminatedUnionErrors`. Для каждой невалидной формы код заново обходит большую JSON Schema, хотя скомпилированный `TypeCheck` для формы уже общий и переиспользуется через кэш validation schema.

## Решение

Добавить внутренний кэш `ExpansionContext` по объекту `TypeCheck<TSchema>` в `packages/core/metadata/validation/discriminatedUnionErrors.ts`.

`expandDiscriminatedUnionErrors(errors, schema)` должен получать контекст через небольшую функцию:

- если `schema` не передана, возвращается пустой контекст;
- если `schema` передана и контекст уже есть в `WeakMap`, он переиспользуется;
- если контекста нет, код один раз собирает `references`, вычисляет `referenceKey` и кладёт результат в `WeakMap`.

Кэш должен быть `WeakMap`, чтобы не продлевать жизнь скомпилированных схем после завершения validation. Публичный API и формат диагностик не меняются.

## Границы

- Не добавляем многопоточность.
- Не меняем `validateProject`, порядок обхода файлов и сортировку диагностик.
- Не отключаем расширение discriminated-union ошибок и не ухудшаем сообщения.
- Не добавляем знания о конкретных metadata-объектах в общий слой validation.
- Не меняем правила `rules.ts`, schema export или YAML-import.

## Поток данных

`validateParsedFile` получает ошибки TypeBox и передаёт их в `typeboxErrorsToDiagnostics`. Там, как и сейчас, вызывается `expandDiscriminatedUnionErrors`.

Новое поведение отличается только внутри `expandDiscriminatedUnionErrors`: контекст ссылок для одной и той же скомпилированной схемы строится один раз. Далее существующий кэш `unionSchemaCache` продолжает использовать `referenceKey` для кэша веток discriminated union.

## Ошибки

Если сбор ссылок или компиляция ветки union не удаётся, поведение остаётся прежним: код возвращает исходную TypeBox-ошибку вместо расширенной. Новый кэш не должен скрывать исключения и не должен менять резервную логику.

## Проверка

- Добавить модульный тест, который вызывает `expandDiscriminatedUnionErrors` несколько раз с одним `TypeCheck` и подтверждает, что результат диагностик не меняется.
- По возможности закрепить кэширование через тестовый счётчик или экспортированный для тестов маленький переходник; если это потребует заметного усложнения публичного API, ограничиться поведенческим тестом и измерением.
- Прогнать существующие тесты validation вокруг `validateFile`/`validateProject`.
- После реализации прогнать `pnpm --filter @nakidka/core type-check` и `pnpm test`.
- Для проверки эффекта повторить полный validate `/Users/nikita/git/nkdk-yaml` и сравнить время с последней диагностикой.

## Критерий готовности

Полная validation выдаёт те же ошибки, но повторно не обходит большую schema формы для каждого невалидного файла. Ожидаемый выигрыш — убрать основную часть времени, которое профиль относил к `collectSchemaReferences` и `visit` внутри `discriminatedUnionErrors.ts`.
