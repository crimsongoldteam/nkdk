# Fixture Wizard Design

## Context

В `/Users/nikita/git/roundTripElements` лежит выгрузка конфигурации 1С для пополнения XML-фикстур. Сейчас для прикладных объектов в `packages/core/metadata/appliedObjects/**` используются две раскладки:

- `__fixtures__/full.xml` и `__fixtures__/minimal.xml` для локальных fromXML/toXML проверок;
- `__fixtures__/sync/xml/**` для `convertFromXML.test.ts` и `syncToXML.test.ts`.

Пример справочника показывает важную особенность: исходные связанные файлы лежат в выгрузке рядом с объектом, например `Catalogs/<Имя>/Ext`, `Forms`, `Templates`, `Commands`, а sync-фикстура хранит их плоско внутри `__fixtures__/sync/xml/Ext`, `Forms`, `Templates`, `Commands`.

## Goal

Сделать интерактивный мастер подготовки XML-фикстур из выгрузки. Мастер должен ускорить перенос исходных XML в проект, не меняя содержимое XML и не создавая YAML-фикстуры.

## Non-Goals

- Не генерировать `rules.ts`, `types.ts` или тесты.
- Не изменять XML-фикстуры после копирования.
- Не строить полный манифест всех типов объектов.
- Не запускать тесты автоматически.
- Не создавать `__fixtures__/sync/nkdk`; это отдельный шаг после конвертации.

## User Flow

Команда запускается из корня проекта с путём к выгрузке и целевым metadataItem, например:

```bash
pnpm --filter @nakidka/core exec tsx packages/core/scripts/fixture-wizard/index.ts metadataCatalog /Users/nikita/git/roundTripElements
```

Мастер определяет целевую папку фикстур по metadataItem и находит XML-каталог в выгрузке. Если `rule.xmlDir` доступен из правила, он используется как основной источник. Если определить каталог нельзя, мастер просит выбрать каталог из выгрузки.

Далее мастер предлагает кандидатов:

- для `full.xml`: сначала XML с `ВсеСвойства` в имени;
- для `minimal.xml`: сначала XML с `ПоУмолчанию` в имени;
- если кандидатов несколько, показывает список;
- если кандидата нет, предлагает выбрать любой XML или пропустить `minimal`.

После подтверждения мастер копирует:

- выбранный full XML в `__fixtures__/full.xml`;
- выбранный minimal XML в `__fixtures__/minimal.xml`, если он выбран;
- выбранный full XML в `__fixtures__/sync/xml/<ИсходноеИмя>.xml`;
- связанные файлы из `<xmlDir>/<ИсходноеИмя>/Ext`, `Forms`, `Templates`, `Commands` в соответствующие папки `__fixtures__/sync/xml`.

## Components

### Target Resolver

Отвечает за связь между пользовательским ключом `metadataCatalog` и каталогом `packages/core/metadata/appliedObjects/metadataCatalog`.

Если рядом есть `rules.ts` с `xmlDir`, мастер использует этот каталог в выгрузке. Если правило нельзя безопасно импортировать из-за зависимостей или побочных эффектов, мастер переходит к ручному выбору XML-каталога.

### Candidate Scanner

Сканирует только XML-файлы верхнего уровня выбранного каталога выгрузки. Папки объекта используются позже только для связанных файлов.

Сканер возвращает списки full/minimal кандидатов и общий список XML для ручного выбора. Служебные файлы вроде `.DS_Store` игнорируются.

### Interactive Picker

Показывает предложенный выбор и позволяет принять его по Enter или выбрать другой пункт. Для `minimal` доступен вариант пропуска, потому что не для всех объектов есть минимальная фикстура.

### Fixture Copier

Создаёт недостающие папки `__fixtures__` и `__fixtures__/sync/xml`. Копирование выполняется только после итогового подтверждения списка изменений.

Перед обновлением существующих `full.xml`, `minimal.xml` и `sync/xml/<Имя>.xml` мастер явно показывает, какие файлы будут перезаписаны.

Связанные папки копируются только если существуют. Пустые папки не создаются.

## Data Flow

1. Пользователь передаёт metadataItem и путь к выгрузке.
2. Target Resolver находит каталог metadataItem и XML-каталог выгрузки.
3. Candidate Scanner собирает XML-кандидатов.
4. Interactive Picker выбирает full и minimal.
5. Fixture Copier показывает итоговый план копирования.
6. Пользователь подтверждает.
7. Fixture Copier копирует файлы.
8. Мастер печатает список созданных и обновлённых файлов.
9. Мастер печатает точечные команды тестов для выбранного metadataItem.

## Error Handling

Если путь к выгрузке не существует, команда завершается с понятной ошибкой.

Если metadataItem не найден в `packages/core/metadata/appliedObjects`, команда показывает доступные каталоги.

Если XML-каталог пуст или не найден, мастер просит выбрать другой каталог. Если пользователь не выбирает каталог, команда завершается без изменений.

Если целевой файл уже существует, он перезаписывается только после подтверждения. Если подтверждение не дано, команда завершается без изменений.

Если копирование части файлов не удалось, команда показывает путь и причину ошибки. Уже скопированные файлы не откатываются автоматически; это будет явно указано в сообщении.

## Verification

После копирования мастер выполняет лёгкие проверки:

- `__fixtures__/full.xml` существует и совпадает с выбранным full XML;
- `__fixtures__/minimal.xml` существует и совпадает с выбранным minimal XML, если minimal выбран;
- `__fixtures__/sync/xml/<ИсходноеИмя>.xml` существует и совпадает с выбранным full XML;
- список скопированных связанных файлов совпадает со списком найденных файлов в `Ext`, `Forms`, `Templates`, `Commands`.

Мастер не запускает тесты сам. В конце он печатает команды вида:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/<metadataItem>/fromXML.test.ts
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/<metadataItem>/toXML.test.ts
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/<metadataItem>/convertFromXML.test.ts
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/<metadataItem>/syncToXML.test.ts
```

## Acceptance Criteria

- Можно выбрать full и minimal XML из каталога выгрузки.
- Мастер предлагает `ВсеСвойства` и `ПоУмолчанию` как значения по умолчанию.
- Можно выбрать исключение из списка, если имя не подходит под соглашение.
- `full.xml`, `minimal.xml` и `sync/xml/<Имя>.xml` создаются в правильных местах.
- Связанные `Ext`, `Forms`, `Templates`, `Commands` раскладываются в `sync/xml` по образцу справочника.
- XML копируется без изменений.
- Перед перезаписью существующих файлов есть явное подтверждение.
- В конце выводится список файлов и точечные команды тестов.
