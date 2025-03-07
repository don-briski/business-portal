import { SafeHtml } from "@angular/platform-browser";

export class PushNotification {
  id: number;
  title: objType;
  content: objType;
  contentVal: SafeHtml;
  excerpt: objType;
  excerptVal: SafeHtml;
  opened: boolean;
}

export class objType {
  protected: boolean;
  rendered: string;
}
