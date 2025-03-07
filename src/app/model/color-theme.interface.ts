export interface ColorThemeInterface {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  theme?: string;
  dark?: {
    primaryColor?: string;
    secondaryColor?: string;
    cardColor?: string;
    textColor?: string;
  };
  light?: {
    primaryColor?: string;
    secondaryColor?: string;
    cardColor?: string;
    textColor: string;
  };
}
