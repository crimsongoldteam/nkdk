# CommandInterface: порядок полей Item из reference

## Контекст

Short round-trip для `Catalogs/СоглашенияСПоставщиками/Forms/ФормаСписка/Ext/Form.xml` показывает перестановку полей внутри `CommandInterface.CommandBar.Item`.

В исходном XML часть элементов идёт в порядке:

```xml
<Command>
<Type>
<CommandGroup>
<Index>
<DefaultVisible>
<Visible>
```

Текущий экспорт `CommandInterfaceItem` собирает объект вручную и всегда пишет `CommandGroup` после `DefaultVisible`. Это не использует уже существующий механизм reference-порядка, который есть в `exportPropertiesToXML`.

## Цель

Сохранять порядок XML-полей внутри `CommandInterfaceItem` из reference-формы при `syncFormToXML`, не меняя смысл `Index` и не вводя глобальный порядок для всех форм.

## Reference

Reference уже читается существующим путём:

1. `syncFormToXML` берёт `referenceDir` или `outputDir`.
2. `readFormFromXML` читает `Forms/<formName>/Ext/Form.xml`.
3. `importClientApplicationFormFromXML` импортирует форму с `fromXML.forReference = true`.
4. `exportClientApplicationFormToXML` получает `referenceForm`.
5. `exportPropertiesToXML` передаёт `referenceMetadata` в экспортёры свойств.

Новый код не должен искать XML-файл заново. Он должен использовать `referenceMetadata`, который уже приходит в экспорт `CommandInterface`.

## Поиск CommandInterfaceItem

Reference-item ищется только внутри той же коллекции:

- `NavigationPanel` ищет в `reference.NavigationPanel`;
- `CommandBar` ищет в `reference.CommandBar`.

Ключ совпадения:

- `Command`;
- `CommandGroup`.

`Index` не входит в ключ, потому что он сам участвует в round-trip шуме и не должен влиять на выбор reference.

Если `CommandGroup` отсутствует у текущего элемента и у reference-элемента, это считается совпадением. Если найден ровно один reference-item, он используется для порядка полей. Если совпадений нет или их несколько, экспорт сохраняет текущий порядок без reference.

## Экспорт

`CommandInterfaceItem` должен экспортироваться с учётом порядка ключей reference-item:

- если reference найден, поля XML пишутся в порядке свойств reference-модели;
- если reference не найден или неоднозначен, используется текущий порядок экспортёра;
- `Command`, `Type`, `Index`, `DefaultVisible`, `CommandGroup`, `Visible` сохраняют прежнюю семантику;
- порядок элементов `Item` в массивах не меняется.

Реализация должна быть локальной для `packages/core/metadata/forms/commonObjects/commandInterface`. Предпочтительно не менять общий orchestration, потому что проблема касается ручного экспортёра `CommandInterfaceItem`.

## Тестирование

Нужен узкий reproducer для случая, где reference XML содержит:

```xml
<Command>...</Command>
<Type>Auto</Type>
<CommandGroup>FormCommandBarCreateBasedOn</CommandGroup>
<Index>1</Index>
<DefaultVisible>false</DefaultVisible>
<Visible>...</Visible>
```

Ожидаемое состояние после исправления:

- импорт сохраняет модель `CommandInterface`;
- экспорт с reference пишет `CommandGroup` перед `Index` и `DefaultVisible`;
- экспорт без reference сохраняет текущий fallback-порядок.

Полный `pnpm test` не входит в подготовку reproducer по правилам `round-trip-xml`; его запускает пользователь после исправления.
