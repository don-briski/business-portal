import { SmsEventsInterface } from "./sms-events.interface";
import { SmsProviderInfoInterface } from "./sms-provider-info.interface";

export interface SmsSetupInterface {
  IsActive?: boolean;
  ActiveSmsProviders?: number | string;
  SendSmsEvents?: SmsEventsInterface;
  SmsProviderInfo?: SmsProviderInfoInterface;
  sendSmsEvents?: SmsEventsInterface;
}
