export const TYPES = {
  IDataPathStrategy: Symbol("IDataPathNameStrategy"),
  INameStrategy: Symbol("INameStrategy"),

  IDefaultsProviderToken: Symbol("IDefaultsProviderToken"),
  IDefaultsRuleToken: Symbol("IDefaultsRuleToken"),

  IBasicDefaultsRuleToken: Symbol("IBasicDefaultsRuleToken"),

  IInputField: Symbol("IInputFieldElement"),
  IInputFieldProperties: Symbol("IInputFieldElementProperties"),

  IInputFieldDefaultsProvider: Symbol("IInputFieldDefaultsProvider"),
  IInputFieldFormatterDefaultsRule: Symbol("IInputFieldDefaultsRule"),

  IInputFieldEnterpriseDefaultsProvider: Symbol("IInputFieldEnterpriseDefaultsProvider"),

  InputFieldPropertiesEnterpriseTransform: Symbol("InputFieldPropertiesEnterpriseTransform"),
  InputFieldEnterpriseTransform: Symbol("InputFieldEnterpriseTransform"),

  InputFieldXMLTransform: Symbol("InputFieldXMLTransform"),

  ICheckBoxField: Symbol("ICheckBoxFieldElement"),
  ICheckBoxFieldProperties: Symbol("ICheckBoxFieldElementProperties"),
  ICheckBoxFieldDefaultsProvider: Symbol("ICheckBoxFieldDefaultsProvider"),
  ICheckBoxFieldFormatterDefaultsRule: Symbol("ICheckBoxFieldDefaultsRule"),

  ILabelFormDecoration: Symbol("ILabelFormDecorationElement"),
  ILabelFormDecorationProperties: Symbol("ILabelFormDecorationElementProperties"),
  ILabelFormDecorationDefaultsProvider: Symbol("ILabelFormDecorationDefaultsProvider"),
  ILabelFormDecorationFormatterDefaultsRule: Symbol("ILabelFormDecorationDefaultsRule"),

  IClientApplicationForm: Symbol("IClientApplicationFormElement"),
  IClientApplicationFormFormatter: Symbol("IClientApplicationFormFormatter"),

  clientApplicationForm: {
    form: Symbol("ClientApplicationFormElement"),
    formatter: Symbol("ClientApplicationFormFormatter"),
    propertiesEnterpriseTransform: Symbol("PropertiesEnterpriseTransform"),
  },

  FormatterFactory: Symbol("FormatterFactory"),
}
