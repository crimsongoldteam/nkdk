# InternalInfo ContainedObject Через Общий Механизм

## Контекст

Корневая `Configuration` сейчас задает `xr:ContainedObject` через отдельное поле правила `containedObjectClassIds` в `packages/core/metadata/appliedObjects/configuration/rules.ts`. Значения в этом списке взяты из конкретной XML-выгрузки конфигурации и не являются универсальными идентификаторами платформы, поэтому их нельзя закреплять в правилах проекта.

Нужно убрать частный механизм и обрабатывать `xr:ContainedObject` общим кодом `InternalInfo`, рядом с `xr:GeneratedType`, но без проектного списка UUID. Работа ведется в отдельном worktree:

`/home/nikita/git/nkdk/.worktrees/internal-info-contained-items`

## Цель

Сделать `InternalInfo` единым механизмом для служебных XML-элементов:

- `xr:GeneratedType` остается текущим поведением для элементов с `name` и `category`;
- `xr:ContainedObject` импортируется, хранится и экспортируется через общий тип `InternalInfo`;
- модель `containedObjects: [{ classId, objectId }]` сохраняется, чтобы не ломать импорт и существующие данные;
- экспорт без reference XML не придумывает `ContainedObject` по жестко заданному списку UUID.

## Рассмотренные Подходы

(А) Оставить `ContainedObject` частью модели `InternalInfo`, но убрать декларативный список UUID.

`items` продолжает описывать только `GeneratedType`, а `containedObjects` обрабатывается тем же экспортом/импортом `InternalInfo` из модели и reference. Это рекомендуемый вариант: он сохраняет XML, не закрепляет идентификаторы конкретной конфигурации в правилах и не меняет модель.

(Б) Перевести `ContainedObject` в модель по именованным ключам, как `GeneratedType`.

Это сделало бы структуру симметричной, но потребовало бы миграции модели и ломало бы текущую форму `containedObjects`. Для текущей задачи это лишнее.

(В) Расширить `InternalInfo.items` элементами `{ kind: "ContainedObject"; classId }`.

Это выглядит единообразно с `GeneratedType`, но требует перечислить `classId` в правилах. Так делать нельзя: найденные UUID относятся к конкретной конфигурации, а не к универсальному контракту платформы.

## Выбранный Дизайн

Используем подход (А).

`InternalInfoPropertyRule.items` остается списком `GeneratedType`:

- текущий элемент `{ name: string; category: string }` сохраняет прежний смысл;
- `containedObjectClassIds` удаляется из типа правила и из `MetadataConfigurationRules`;
- `xr:ContainedObject` остается частью общего типа `InternalInfo`, но берется только из reference или из модели.

В корневой `Configuration` `internalInfo` должен сохраняться из reference XML при round-trip. Если reference отсутствует и модель не содержит `containedObjects`, экспорт не должен создавать `ContainedObject` из жестко заданных UUID.

## Поток Данных

При импорте XML поведение остается прежним:

- `xr:GeneratedType` импортируется в модель по имени;
- `xr:ContainedObject` импортируется в `containedObjects`.

При экспорте `InternalInfo`:

- для `GeneratedType` сохраняет существующую логику `TypeId`/`ValueId`, имя и категорию;
- `containedObjects` берутся из reference, если он есть;
- если reference нет, `containedObjects` берутся из модели;
- если нет ни reference, ни модельного значения, `xr:ContainedObject` не экспортируется.

## Ошибки И Границы

Из типов нужно убрать `containedObjectClassIds`, чтобы новый код не мог случайно снова закрепить частные UUID в `rules.ts`.

Поведение YAML не меняется: `internalInfo` остается `forReferenceOnly`, `toYAML: false`/`fromYAML: false` задаются на корневых служебных свойствах как раньше.

## Фикстуры И Тесты

Нужно добавить тестовую XML-фикстуру для `InternalInfo` с `xr:ContainedObject`, чтобы общий тип имел собственное покрытие, а не только проверку через корневую `Configuration`. Значения в фикстуре допустимы как пример XML-данных, но не должны попадать в `rules.ts`.

Проверки:

- импорт `ContainedObject` в `containedObjects`;
- round-trip `ContainedObject` через `exportInternalInfoToXML`;
- экспорт `ContainedObject` из reference XML;
- экспорт `ContainedObject` из модели без reference;
- отсутствие `ContainedObject` при экспорте без reference и без модельного значения;
- существующий тест `root Configuration XML` проверяет сохранение `InternalInfo` при round-trip, но не требует генерации частных UUID из правила.

После изменений выполнить точечные тесты `internalInfo` и `configuration`, затем полный `pnpm test`.

## Критерии Готовности

- `containedObjectClassIds` удален из типов и правил.
- Корневая конфигурация не содержит жестко заданных UUID из конкретной выгрузки.
- XML round-trip для существующих фикстур не меняется.
- Новая фикстура покрывает `ContainedObject` на уровне общего `InternalInfo`.
- `pnpm test` проходит из worktree.
