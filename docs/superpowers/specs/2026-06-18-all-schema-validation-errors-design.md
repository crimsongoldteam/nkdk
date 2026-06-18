# Исправление schema-only ошибок all validation

## Контекст

После исправления `metadataTarget` object/member схем валидация `/tmp/round-trip-yaml-validation/current/all` показывает `19 error, 92 warning`.
Пользователь выбрал сначала исправлять только schema-only ошибки, без изменения resolver, DataPath, XML-фикстур, YAML-файлов и import/export-логики.

## Границы

Входит:

- `WebSocketКлиент/WebSocketКлиентВсеСвойства/Свойства.yaml`: схема `WebSocketClientHeaders` должна описывать YAML-представление `Ключ` / `Значение`.
- `ОбщаяФорма/PlannerField` и `ОбщаяФорма/УсловноеОформление`: schema должна принимать строковый XML-фрагмент настроек `Планировщик`, который уже импортируется/экспортируется settings-fragment слоем.
- `ОбщаяФорма/ДинамическийСписок`: `ChoiceParameters` в schema должны принимать простые числовые значения параметров выбора.
- `РегистрРасчета/РегистрРасчетаВсеСвойства`: schema для `Recalculations` должна принимать карту перерасчетов с пустыми объектами `{}`.

Не входит:

- `DataPath` ошибка для пути `1/0:796f500f-c364-45d1-bce6-9e7e8e15b664`.
- Ошибки resolver для `ВнешнийИсточникДанных.*`.
- Предупреждения dynamic list и platform source.

## Подход

Исправления должны быть schema-only:

- добавлять или уточнять `exportToJSONSchema` для существующих типов;
- переиспользовать уже существующие модели YAML там, где они есть;
- не менять `fromXML/toXML/fromYAML/toYAML`;
- не редактировать XML-фикстуры и выгруженный YAML.

## Проверка

На каждую группу нужен RED/GREEN тест:

- `webSocketClientHeaders/toJSONSchema.test.ts`;
- тест для settings fragment или `formAttribute` schema, подтверждающий `Планировщик: "<xml>"`;
- `сhoiceParameters` schema-тест для числового значения;
- `recalculation` schema-тест для `{}`.

После точечных тестов:

- запустить `all` validation на `/tmp/round-trip-yaml-validation/current/all`;
- ожидаемый результат: schema-only ошибки уходят, общий счетчик снижается примерно `19 -> 3`;
- финально запустить `pnpm test`.

