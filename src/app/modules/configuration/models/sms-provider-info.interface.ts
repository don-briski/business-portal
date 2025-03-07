export interface SmsProviderInfoInterface {
  MultitexterSmsProviderInfo: MultiTexterSmsInterface;
  AfricasTalkingSmsProviderInfo: AfricasTalkingInterface;
}

export interface MultiTexterSmsInterface {
  UseApiKey: boolean;
  SenderName: string;
  UserName: string;
  Password: string;
  ApiKey: string;
  Balance?: string;
}

export interface AfricasTalkingInterface {
  UserName: string;
  ApiKey: string;
  SenderId: string;
}

export type SmsProviders = {
  isActive: boolean;
  smsProviderName?: string;
  template?: string;
};

export type SmsInfo = SmsProviders & {
  [key: string]: {
    smsTemplateSyntaxStrings: string[];
  };
};

export type ActivateSmsProvider = {
  isActive: boolean;
  activeSmsProviders: string;
};
