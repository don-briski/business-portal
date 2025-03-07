import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { DOCUMENT } from "@angular/common";

import { ColorThemeInterface } from "../model/color-theme.interface";
import { lightenColorV2 } from "../modules/shared/helpers/generic.helpers";

@Injectable({
  providedIn: "root",
})
export class ColorThemeService {
  private customPrimaryColor = "#d8d8d8";
  private customSecondaryColor = "#d8d8d8";

  private colorTheme$: BehaviorSubject<ColorThemeInterface> =
    new BehaviorSubject<ColorThemeInterface>(null);

  private savedTheme: ColorThemeInterface;
  private selectedPresetTheme: ColorThemeInterface;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  setTheme(theme: ColorThemeInterface, isPreset?: boolean) {
    if (!isPreset) {
      const savedTheme = localStorage.getItem("theme");

      if (savedTheme) {
        this.savedTheme = JSON.parse(
          localStorage.getItem("theme")
        ) as ColorThemeInterface;
      }
    }

    let themeType = (this.savedTheme?.theme || theme?.theme) as "lite" | "dark";
    themeType = theme?.theme !== "dark" ? "lite" : "dark";

    if (themeType === "dark" && !isPreset) {
      theme = {
        primaryColor: this.savedTheme?.primaryColor || theme?.primaryColor,
        secondaryColor:
          this.savedTheme?.secondaryColor || theme?.secondaryColor,
        theme: themeType,
        dark: this.savedTheme?.dark || theme?.dark,
      };
    } else if (themeType === "dark" && isPreset) {
      theme = {
        primaryColor: theme?.primaryColor,
        secondaryColor: theme?.secondaryColor,
        theme: themeType,
        dark: { primaryColor: "#434343" },
      };
    } else if (themeType === "lite") {
      theme = {
        primaryColor: theme?.primaryColor,
        secondaryColor: theme?.secondaryColor,
        theme: themeType,
      };
    }

    this.setStyleSheet(themeType);

    this.colorTheme$.next(theme);
    localStorage.setItem("theme", JSON.stringify(theme));
  }

  setStyleSheet(type: "dark" | "lite") {
    this.document
      .getElementById("theme")
      .setAttribute("href", `assets/css/${type}-style-1.min.css`);
    sessionStorage.setItem("dt-theme", type);
    $(document).ready(() => {
      $.getScript("assets/js/script.js");
    });
  }

  setBaseTheme(type: "dark" | "lite") {
    let colorTheme: ColorThemeInterface;
    if (type === "dark") {
      colorTheme = {
        primaryColor:
          this.selectedPresetTheme?.primaryColor || this.customPrimaryColor,
        secondaryColor:
          this.selectedPresetTheme?.secondaryColor || this.customSecondaryColor,
        theme: type,
        dark: {
          primaryColor: "#434343",
        },
      };
    } else {
      colorTheme = {
        primaryColor:
          this.selectedPresetTheme?.primaryColor || this.customPrimaryColor,
        secondaryColor:
          this.selectedPresetTheme?.secondaryColor || this.customSecondaryColor,
        theme: type,
      };
    }

    this.setTheme(colorTheme);
  }

  getTheme(): BehaviorSubject<ColorThemeInterface> {
    const localTheme = localStorage.getItem("theme");
    if (
      localTheme &&
      localStorage !== undefined &&
      localTheme !== "undefined"
    ) {
      const theme = JSON.parse(localTheme) as ColorThemeInterface;
      this.colorTheme$.next(theme);
      document.documentElement.style.setProperty(
        "--primary-color",
        theme?.primaryColor
      );
      document.documentElement.style.setProperty(
        "--theme-color",
        theme?.primaryColor
      );
      document.documentElement.style.setProperty(
        "--secondary-color",
        theme?.secondaryColor
      );
      document.documentElement.style.setProperty(
        "--text-strong",
        "#393A3B"
      );
      document.documentElement.style.setProperty(
        "--primary-color-lighter",
        lightenColorV2(theme?.primaryColor, 45)
      );

      document.documentElement.style.setProperty(
        "--secondary-color-lighter",
        lightenColorV2(theme?.secondaryColor, 45)
      );
    }
    return this.colorTheme$;
  }

  resetTheme(): void {
    this.colorTheme$.next(this.savedTheme);
    localStorage.setItem("theme", JSON.stringify(this.savedTheme));
  }

  saveSelectedPresetTheme(theme: ColorThemeInterface) {
    this.selectedPresetTheme = theme;
  }
}
