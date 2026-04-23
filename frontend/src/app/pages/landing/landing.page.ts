import { Component, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
})
export class LandingPage {
  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
