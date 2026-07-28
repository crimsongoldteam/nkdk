# Удаление временного анализатора порядка правил

## Цель

Полностью удалить временный инструмент, который собирал порядок XML-свойств из конфигураций и
записывал `xmlOrder` в rules.ts. Готовый runtime-механизм `xmlOrder` и полученные данные остаются.

## Удаляемые части

- `packages/core/metadata/ruleOrderAnalysis`;
- `packages/core/scripts/rule-order-analysis`;
- команды `analyze-rule-order` и `rewrite-rule-order`;
- `RulePropertyOrderCollector` и его передача через общий импорт, вложенные metadata-объекты и формы;
- команду `analyzeRuleOrder`, результат анализа и связанные типы в XML-import worker и worker pool;
- тесты, проверяющие только сбор, агрегацию, отчёт и перезапись исходников.

## Сохраняемые части

- `MetadataItemRule.xmlOrder`;
- кэшированный `getCompiledXMLPropertyOrder`;
- использование `xmlOrder` при XML-экспорте и проекции BaseForm;
- `ConfigurationXmlNode.present`;
- специальные `ConfigurationXmlNode.order` для коллекций и интерфейсов;
- заполненные `xmlOrder` во всех rules.ts;
- тесты постоянного runtime-поведения `xmlOrder` и `present`;
- спецификацию итогового механизма порядка.

## Изменение рабочего алгоритма

Обычный XML-импорт перестаёт принимать и передавать необязательный `ruleOrderCollector`. Worker
поддерживает только рабочие команды `initialize`, `firstPass`, `secondPass` и `dispose`. На XML- и
YAML-форматы это не влияет.

## Проверка

- поиск по проекту не находит `ruleOrderAnalysis`, `rule-order-analysis`, `ruleOrderCollector` и
  `analyzeRuleOrder` вне исторических планов;
- `pnpm --dir packages/core type-check` проходит;
- `pnpm test` из корня проходит;
- удаление оформляется отдельным коммитом после коммита спецификации.
