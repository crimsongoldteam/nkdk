# Приёмка MobileDeviceCommandBarContent

`MobileDeviceCommandBarContent` описан [YAML-декларацией](../../../rust/declarations/common/mobile-device-command-bar-content.yaml), которая повторно использует объявленный элемент `ChoiceList`. XML-путь и название YAML задаёт [правило свойства формы](../../../rust/declarations/probes/mobile-device-command-bar-content.yaml). Второго Rust-обработчика и копии правил для `xr:Presentation`, `xr:CheckState` или `xr:Value` нет.

[Rust-проверки](../../../rust/crates/compiled-rules/tests/mobile_device_command_bar_content.rs) покрывают старые фикстуры, две неизменённые e2e-формы, список из двух элементов, пустые формы, неверный `CheckState`, строковое и составное типизированное значение и XML из YAML без референса. Для исходных XML проверено восстановление формы. Общая схема элементов уже проверяется тестами `ChoiceList` и `MetadataValue`; для мобильной формы требуется только проверка подключения свойства при её отдельной приёмке.

При проверке обнаружена общая ошибка: вложенная строковая проекция при экспорте из YAML становилась пустой. Исправлен общий переходник чтения проекции и уточнено условие пустой канонической формы у `MetadataValue`. Добавлен регрессионный тест в `ChoiceList`; все его прежние случаи проходят.
