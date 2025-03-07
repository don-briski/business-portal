export interface WebhookConfig {
  activated: boolean;
  appId: string;
  webhookUrl: string;
  endpointId: string;
  endpointSecret: string;
  subscriptions: string[];
};
