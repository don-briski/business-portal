import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "lnd-initials",
  template: `
    <div [class]="classes" [style.backgroundColor]="bgColor">
      {{ text | uppercase }}
    </div>
  `,
  styles: [
    "div {min-width:50px;min-height:50px;border-radius:100%;display:flex;justify-content:center;align-items:center}",
  ],
})
export class InitialsComponent implements OnInit {
  @Input() text: string = "";
  @Input() classes: string = "";
  @Input() bgColor: string = "";

  ngOnInit(): void {
    const lastIndex = this.text.split(" ").length - 1;
    this.text =
      this.text.split(" ")[0].split("")[0] +
      " " +
      this.text.split(" ")[lastIndex].split("")[0]
  }
}
