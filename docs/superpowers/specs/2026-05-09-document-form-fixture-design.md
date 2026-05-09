# Фикстура формы документа

## Задача

Добавить покрытие для новой XML-фикстуры формы документа:
`packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.xml`.

Фикстура должна проверять импорт и экспорт формы в модель, XML и YAML. Недостающие свойства формы документа нужно добавить в `clientApplicationForm/rules.ts` отдельной областью, чтобы документные поля не смешивались с общими свойствами формы и полями Catalog.

## Подход

Используем отдельные файлы фикстур вместо расширения устаревшего `__fixtures__/data.ts`.

Планируемые файлы:

- `__fixtures__/documentFull.ts` - модель `ClientApplicationForm` для `documentFull.xml`.
- `__fixtures__/documentFull.yaml.ts` или соседнее имя в существующем стиле - YAML-представление той же формы.

Тесты могут импортировать эти файлы напрямую. Если существующие тесты удобнее поддержать через общий вход, `data.ts` допускается использовать только как тонкий переэкспорт без размещения новых данных внутри него.

## Правила

В `packages/core/metadata/forms/clientApplicationForm/rules.ts` добавить отдельную область:

```ts
// #region Document
autoTime: { /* поле AutoTime */ },
usePostingMode: { /* поле UsePostingMode */ },
repostOnWrite: { /* поле RepostOnWrite */ },
// #endregion
```

В нее включить недостающие поля из `documentFull.xml`:

- `autoTime` для XML `AutoTime`, тип `SystemEnumeration`, `typeSE: "AutoTimeMode"`.
- `usePostingMode` для XML `UsePostingMode`, тип `SystemEnumeration`, `typeSE: "DocumentPostingMode"` или ближайший уже существующий тип, соответствующий значениям XML/YAML.
- `repostOnWrite` для XML `RepostOnWrite`, тип `boolean`.

Поля добавляются без `order`, если тесты не покажут, что порядок нельзя восстановить по референсу.

## Тесты

Добавить отдельные проверки для `documentFull`:

- `fromXML.test.ts`: импорт `documentFull.xml` в модель.
- `toXML.test.ts`: экспорт модели обратно в XML с `documentFull.xml` как референсом.
- `fromYAML.test.ts`: импорт YAML-фикстуры в модель.
- `toYAML.test.ts`: экспорт модели в YAML-фикстуру.

XML-фикстура остается источником истины и не изменяется.

## Проверка

Минимальная проверка после реализации:

- точечные тесты `clientApplicationForm`;
- затем общий `pnpm test`, если точечные тесты зеленые.
