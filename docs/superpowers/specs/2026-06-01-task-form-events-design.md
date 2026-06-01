# Дизайн: события формы задачи в YAML round-trip

## Контекст

В полном YAML round-trip остаётся смысловое расхождение:

- `Tasks/ЗадачаВсеСвойства/Forms/ФормаЗадачи/Ext/Form.xml`.

После исправления исходной XML-фикстуры остаётся одно смысловое расхождение в блоке `<Events>`:

```xml
<Event name="ActivationProcessing">ОбработкаАктивации</Event>
<Event name="BeforeExecute">ПередВыполнением</Event>
```

`ActivationProcessing` импортируется и экспортируется корректно. Расхождение остаётся только для `BeforeExecute`.

## Согласованное решение для `BeforeExecute`

`BeforeExecute` нужно считать обычным известным событием формы.

Добавить в `packages/core/metadata/forms/clientApplicationForm/rules.ts`:

```ts
beforeExecute: "ПередВыполнением"
```

Ожидаемое поведение:

1. XML `<Event name="BeforeExecute">ПередВыполнением</Event>` импортируется в модель как `beforeExecute`.
2. YAML содержит `ПередВыполнением: ПередВыполнением`.
3. Обратный sync экспортирует XML-имя `BeforeExecute`, а не `beforeExecute`.

## Фикстуры

Добавить проектную sync-фикстуру, а не строки внутри теста:

- XML с событиями `ActivationProcessing` и `BeforeExecute`;
- YAML с обычными событиями `ОбработкаАктивизации`/`ОбработкаАктивации` и `ПередВыполнением`;
- ожидаемый sync XML должен экспортировать `ActivationProcessing` без изменений и `BeforeExecute` с правильным регистром.

Можно использовать существующую форму:

- `packages/core/metadata/appliedObjects/metadataTask/__fixtures__/sync/xml/ЗадачаВсеСвойства/Forms/ФормаЗадачи/Ext/Form.xml`;
- соответствующий YAML формы задачи.

## Проверка

Точечно:

```sh
pnpm --dir packages/core test:isolated metadata/appliedObjects/metadataTask/syncToXML.test.ts metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Реальный сценарий:

```sh
pnpm --dir packages/cli dev sync /home/nikita/git/temp-yaml /tmp/nkdk-task-form-events --reference /home/nikita/git/round-trip/all
```

Ожидание: `Tasks/ЗадачаВсеСвойства/Forms/ФормаЗадачи/Ext/Form.xml` не меняет события `ActivationProcessing` и `BeforeExecute`.
