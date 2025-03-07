import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from "@angular/core";

@Directive({
  selector: "[lndStuck]",
})
export class StuckDirective implements OnInit, OnDestroy {
  @Input("lndStuck") className = "";

  observer?: IntersectionObserver;

  constructor(private elRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    const element = this.elRef.nativeElement;
    this.renderer.setStyle(element, "position", "sticky");
    this.renderer.setStyle(element, "top", "-1px");

    this.observer = new IntersectionObserver(
      ([e]) => {
        e.intersectionRatio < 1
          ? this.renderer.addClass(element, this.className)
          : this.renderer.removeClass(element, this.className);
      },
      { threshold: [1] }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
