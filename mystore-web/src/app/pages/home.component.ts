import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { StoreService } from '../core/store.service';
import { Category, Product } from '../core/models';
import { AuthService } from '../core/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  styles: [`
    .fashion-hero { display: block; }
    .hero-copy { width: 50%; }
    .hero-copy h1 { color: #fff; }
    .hero-copy h1 em { color: #f2daca; }
    .hero-copy .hero-kicker, .hero-copy > p, .hero-copy .hero-note { color: #f5eae0; }
    .hero-copy .hero-kicker span, .hero-copy .hero-note-line { background: #e0c3ad; }
    .hero-art { position: absolute; inset: 0; z-index: 0; height: auto; overflow: hidden; margin: 0; border-radius: 20px; background: none; box-shadow: none; }
    .hero-art::after { content: ''; position: absolute; inset: 0; z-index: 1; background: linear-gradient(90deg, rgba(28,18,16,.72), rgba(28,18,16,.38) 48%, rgba(28,18,16,.12)); pointer-events: none; }
    .hero-track { position: absolute; inset: 0; display: flex; width: 100%; height: 100%; transition: transform 650ms cubic-bezier(.2,.7,.2,1); }
    .hero-slide { flex: 0 0 100%; min-width: 0; background-position: center; background-size: cover; }
    .hero-carousel-controls { position: absolute; z-index: 2; right: 18px; bottom: 18px; display: flex; align-items: center; gap: 8px; }
    .hero-carousel-arrow { width: 34px; height: 34px; padding: 0; display: grid; place-items: center; background: #fbf9f5e8; color: var(--ink); font-size: 20px; }
    .hero-carousel-dot { width: 8px; height: 8px; padding: 0; border: 1px solid #fff; border-radius: 50%; background: #ffffffa6; }
    .hero-carousel-dot.active { width: 20px; border-radius: 5px; background: var(--wine); }
    .hero-image-caption { z-index: 2; right: 150px; }
    .hero-stamp { z-index: 1; }
    .hero-index { z-index: 2; top: 24px; right: 7.5%; bottom: auto; color: #fff; }
    .clear-filter { font-size: 14px; }
    .product-size-select { position: absolute; z-index: 2; right: 12px; bottom: 56px; left: 12px; width: calc(100% - 24px); padding: 8px; border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--ink); }
    .image-cycle { position: absolute; z-index: 2; top: 50%; width: 30px; height: 30px; padding: 0; border-radius: 50%; background: #fbf9f5e8; color: var(--ink); transform: translateY(-50%); }
    .image-cycle.previous { left: 8px; }
    .image-cycle.next { right: 8px; }
    .product-price del { margin-right: 6px; color: var(--muted); font-size: .85em; }
    .product-image-link { position:absolute; inset:0; display:block; }
    .product-image-link img { display:block; }
    .product-details-link { display:inline-block; margin-top:9px; color:var(--wine); font-size:11px; text-decoration:underline; text-underline-offset:3px; }
    .category-carousel-container { position: relative; padding: 16px 48px; border: 1px solid var(--line); border-radius: 20px; background: #fff; }
    .category-carousel-controls { position: absolute; z-index: 1; inset: 0; display: flex; align-items: center; justify-content: space-between; pointer-events: none; }
    .category-carousel-controls button { width: 36px; height: 36px; padding: 0; border: 1px solid var(--line); border-radius: 50%; background: #fbf9f5; color: var(--ink); font-size: 20px; pointer-events: auto; }
    .category-grid { display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 51px) / 4); grid-template-columns: none; gap: 17px; overflow-x: auto; padding: 2px 2px 8px; scroll-snap-type: x mandatory; scrollbar-width: none; }
    .category-grid::-webkit-scrollbar { display: none; }
    .category-tile { width: 100%; scroll-snap-align: start; }
    @media (max-width: 900px) { .category-grid { grid-auto-columns: calc((100% - 17px) / 2); } }
    @media (max-width: 650px) {
      .category-carousel-container { padding: 12px 40px; }
      .category-grid { grid-auto-columns: 100%; }
    }
    @media (max-width: 900px) { .hero-copy { width: 55%; } }
    @media (max-width: 650px) {
      .fashion-hero { display: block; min-height: 600px; padding: 38px 22px 54px; }
      .hero-copy { width: 100%; }
      .hero-art { height: auto; margin: 0; }
      .hero-carousel-controls { right: 10px; bottom: 10px; gap: 6px; }
      .hero-carousel-arrow { width: 30px; height: 30px; }
      .hero-image-caption { right: 128px; bottom: 15px; left: 14px; }
      .hero-index { top: 18px; right: 22px; }
    }
    @media (prefers-reduced-motion: reduce) { .hero-track { transition: none; } }
  `],
  template: `
    <section class="fashion-hero">
      <div class="hero-copy">
        <span class="hero-kicker"><span></span> THE NEW SEASON EDITION</span>
        <h1>Threads of<br><em>tradition.</em></h1>
        <p>Discover beautiful textiles, timeless weaves and pieces made to be treasured.</p>
        <button class="hero-cta" (click)="scrollToCollection()">Explore the collection <span>↗</span></button>
        <div class="hero-note"><span class="hero-note-line"></span> Curated with care · Made for you</div>
      </div>
      <div class="hero-art" aria-label="Featured textile collections" (mouseenter)="pauseHeroAutoplay()" (mouseleave)="startHeroAutoplay()" (focusin)="pauseHeroAutoplay()" (focusout)="startHeroAutoplay()">
        <div class="hero-track" [style.transform]="'translateX(-' + activeHeroSlide() * 100 + '%)'">
          @for (slide of heroSlides; track slide.image; let i = $index) {
            <div class="hero-slide" role="img" [attr.aria-label]="slide.alt" [attr.aria-hidden]="i !== activeHeroSlide()" [style.background-image]="'linear-gradient(180deg, rgba(48,31,27,.02), rgba(48,31,27,.2)), url(' + slide.image + ')' "></div>
          }
        </div>
        <!-- <div class="hero-stamp">M<br><small>EST. 2026</small></div> -->
        <div class="hero-image-caption">{{ heroSlides[activeHeroSlide()].caption }}</div>
        <div class="hero-carousel-controls" aria-label="Banner carousel controls">
          <button type="button" class="hero-carousel-arrow" aria-label="Previous slide" (click)="showHeroSlide(activeHeroSlide() - 1)">‹</button>
          @for (slide of heroSlides; track slide.image; let i = $index) {
            <button type="button" class="hero-carousel-dot" [class.active]="i === activeHeroSlide()" [attr.aria-label]="'Show slide ' + (i + 1)" [attr.aria-current]="i === activeHeroSlide() ? 'true' : null" (click)="showHeroSlide(i)"></button>
          }
          <button type="button" class="hero-carousel-arrow" aria-label="Next slide" (click)="showHeroSlide(activeHeroSlide() + 1)">›</button>
        </div>
      </div>
      <div class="hero-index">{{ activeHeroSlide() + 1 < 10 ? '0' : '' }}{{ activeHeroSlide() + 1 }} <span>/</span> 03</div>
    </section>

    <section class="promise-strip" aria-label="Shopping benefits">
      <div><span class="promise-icon">✳</span><span><b>Thoughtfully selected</b><small>Quality you can feel</small></span></div>
      <div><span class="promise-icon">◇</span><span><b>Easy & secure checkout</b><small>Shop with confidence</small></span></div>
      <div><span class="promise-icon">↗</span><span><b>Delivered to your door</b><small>Across India</small></span></div>
    </section>

    <section class="collection-section" id="collections">
      <div class="editorial-heading">
        <div><span class="section-kicker">FIND YOUR FAVOURITE</span><h2>Shop by <em>collection</em></h2></div>
        <p>From everyday essentials to moments worth dressing up for.</p>
      </div>
      <div class="category-carousel-container">
        @if (categories().length > 1) {
          <div class="category-carousel-controls" aria-label="Collection carousel controls">
            <button type="button" aria-label="Previous collections" (click)="scrollCategories(categoryCarousel, -1)">‹</button>
            <button type="button" aria-label="Next collections" (click)="scrollCategories(categoryCarousel, 1)">›</button>
          </div>
        }
        <div class="category-grid" #categoryCarousel role="region" aria-label="Shop by collection" tabindex="0">
          @for (category of categories(); track category.id; let i = $index) {
            <button class="category-tile" [class]="'category-tile category-tone-' + (i % 4)" (click)="selectCategory(category.id)">
              <span class="category-photo" [style.background-image]="categoryImage(category.name, i)"></span>
              <span class="category-overlay"></span>
              <span class="category-copy"><small>EXPLORE</small><b>{{ category.name }}</b><span class="category-arrow">↗</span></span>
            </button>
          } @empty {
            <div class="category-fallback"><span>01</span><b>Beautiful things begin with a thread.</b><small>Our collections are being prepared.</small></div>
            <div class="category-fallback"><span>02</span><b>Made for everyday moments.</b><small>Explore the latest arrivals below.</small></div>
          }
        </div>
      </div>
    </section>

    <section class="products-section" id="products">
      <div class="editorial-heading product-heading">
        <div><span class="section-kicker">A LITTLE SOMETHING SPECIAL</span><h2>Pieces to <em>fall for</em></h2></div>
      </div>
      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (loading()) {
        <div class="loading-state">Gathering the collection…</div>
      } @else {
        <div class="textile-product-grid">
          @for (p of products(); track p.id; let i = $index) {
            <article class="textile-product-card">
              <div class="product-visual">
                <a class="product-image-link" [routerLink]="['/products', p.id]" target="_blank" rel="noopener noreferrer" [attr.aria-label]="'View details for ' + p.name">
                  @if (productImages(p).length) { <img [src]="currentImage(p)" [alt]="p.name" loading="lazy"> }
                  @else { <div class="product-art" [class]="'product-art product-art-' + (i % 4)"><span>THE TEXTILE EDIT</span><b>{{ p.categoryName }}</b></div> }
                </a>
                @if (productImages(p).length > 1) {
                  <button type="button" class="image-cycle previous" [attr.aria-label]="'Previous image of ' + p.name" (click)="cycleImage(p, -1)">‹</button>
                  <button type="button" class="image-cycle next" [attr.aria-label]="'Next image of ' + p.name" (click)="cycleImage(p, 1)">›</button>
                }
                <span class="product-label">{{ p.stockQuantity < 1 ? 'SOLD OUT' : (i % 3 === 0 ? 'CURATED PICK' : 'MADE TO LOVE') }}</span>
                @if (p.sizeVariants.length > 0) {
                  <select class="product-size-select" [value]="selectedVariantId(p)" (change)="selectVariant(p, $any($event.target).value)" [attr.aria-label]="'Choose size for ' + p.name">
                    @for (size of p.sizeVariants; track size.id) { <option [value]="size.id" [disabled]="size.stockQuantity < 1">{{size.size}} · {{(size.finalCost ?? size.price ?? p.finalCost) | currency:'INR'}}{{size.stockQuantity < 1 ? ' · Sold out' : ''}}</option> }
                  </select>
                }
                <button class="quick-add" (click)="add(p)" [disabled]="selectedVariantStock(p) < 1" [attr.aria-label]="'Add ' + p.name + ' to cart'">{{ selectedVariantStock(p) < 1 ? 'Unavailable' : 'Add to Cart +' }}</button>
              </div>
              <div class="textile-product-info"><div><span class="product-category">{{ p.categoryName }}</span><h3>{{ p.name }}</h3></div><strong class="product-price">@if(selectedVariantFinalCost(p) < selectedVariantPrice(p)){<del>{{ selectedVariantPrice(p) | currency:'INR':'symbol':'1.0-0' }}</del>}{{ selectedVariantFinalCost(p) | currency:'INR':'symbol':'1.0-0' }}</strong></div>
              <p class="product-description">{{ p.description || 'A thoughtfully selected piece for your collection.' }}</p>
              <a class="product-details-link" [routerLink]="['/products', p.id]" target="_blank" rel="noopener noreferrer">View details ↗</a>
            </article>
          } @empty {
            <div class="empty-collection"><span>✳</span><h3>Nothing here just yet</h3><p>Explore a different collection or check back soon.</p></div>
          }
        </div>
      }
      <div class="collection-footnote"><span></span> Showing the latest pieces from our collection <span></span></div>
    </section>

    <section class="craft-banner">
      <div><span class="section-kicker">THE MYSTORE PROMISE</span><h2>Every thread tells<br>a <em>beautiful story.</em></h2><p>Find pieces that feel like you. Carefully chosen, easy to love, and ready for your next occasion.</p><button (click)="scrollToCollection()">Find your piece ↗</button></div>
      <div class="craft-image" role="img" aria-label="Close-up of richly textured woven fabric"><span>CRAFTED<br>TO BE KEPT</span></div>
    </section>
  `
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly heroSlides = [
    { image: 'https://res.cloudinary.com/x4qzeto6/image/upload/v1793992287/S8J2mDaYGdW854rAnlznm_uRSNW7xQ.png?auto=format&fit=crop&w=1200&q=90', alt: 'Traditional Indian textiles in rich colors', caption: 'A celebration of craft' },
    { image: 'https://res.cloudinary.com/x4qzeto6/image/upload/v1793992287/3QlMRpcHVPyiC-ANOXWZY_xRrlFxgW.png?auto=format&fit=crop&w=1200&q=90', alt: 'A close view of handcrafted fashion', caption: 'Woven with intention' },
    { image: 'https://res.cloudinary.com/x4qzeto6/image/upload/v1793992286/whxAzT_nqFU01zp0Bu4I__73PAVaqK.png?auto=format&fit=crop&w=1200&q=90', alt: 'Detailed woven fabric and textile craft', caption: 'Made to be treasured' }
  ];
  activeHeroSlide = signal(0);
  private heroTimer: ReturnType<typeof setInterval> | null = null;
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  error = signal('');
  loading = signal(true);
  selectedSizes: Record<string, string> = {};
  activeImages: Record<string, number> = {};

  constructor(private store: StoreService, private auth: AuthService, private router: Router) {}
  ngOnInit() {
    this.startHeroAutoplay();
    this.store.categories().subscribe({ next: items => this.categories.set(items.filter(x => x.isActive).slice(0, 10)), error: () => this.categories.set([]) });
    this.load();
  }
  ngOnDestroy() { this.pauseHeroAutoplay(); }
  showHeroSlide(index: number) {
    this.activeHeroSlide.set((index + this.heroSlides.length) % this.heroSlides.length);
  }
  startHeroAutoplay() {
    if (this.heroTimer) return;
    this.heroTimer = setInterval(() => this.showHeroSlide(this.activeHeroSlide() + 1), 5000);
  }
  pauseHeroAutoplay() {
    if (this.heroTimer) clearInterval(this.heroTimer);
    this.heroTimer = null;
  }
  scrollCategories(carousel: HTMLElement, direction: number) {
    carousel.scrollBy({ left: direction * carousel.clientWidth, behavior: 'smooth' });
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.store.products().subscribe({
      next: x => { this.products.set(x.items); this.loading.set(false); },
      error: () => { this.error.set('Unable to load products. Please check your connection and try again.'); this.loading.set(false); }
    });
  }
  selectCategory(id: string) {
    const category = this.categories().find(x => x.id === id);
    if (!category) return;
    this.router.navigate(['/search'], {
      queryParams: { categoryId: category.id, categoryName: category.name }
    });
  }
  categoryImage(name: string, index: number) {
    const n = name.toLowerCase();
    const photo = n.includes('saree') ? 'photo-1610030469983-98e550d6193c' : n.includes('kurti') || n.includes('women') ? 'photo-1583391733956-6c78276477e5' : n.includes('fabric') || n.includes('material') ? 'photo-1604881988758-f76ad2f7aac1' : n.includes('men') ? 'photo-1617137968427-85924c800a22' : ['photo-1609741199886-9f6f4a9e4f8d','photo-1590736969955-71cc94901144','photo-1603252110481-7ba873bf42ab','photo-1604881988758-f76ad2f7aac1'][index % 4];
    return `url('https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=85')`;
  }
  scrollToCollection() { document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' }); }
  productImages(p: Product) { return p.imageUrls?.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []); }
  currentImage(p: Product) { const images = this.productImages(p); return images[this.activeImages[p.id] ?? 0] ?? ''; }
  cycleImage(p: Product, direction: number) {
    const count = this.productImages(p).length;
    if (count > 1) this.activeImages[p.id] = ((this.activeImages[p.id] ?? 0) + direction + count) % count;
  }
  selectedVariantId(p: Product) {
    return this.selectedSizes[p.id] ?? p.sizeVariants.find(size => size.stockQuantity > 0)?.id ?? p.sizeVariants[0]?.id ?? '';
  }
  selectedVariantStock(p: Product) {
    return p.sizeVariants.find(size => size.id === this.selectedVariantId(p))?.stockQuantity ?? 0;
  }
  selectedVariantPrice(p: Product) {
    const variant = p.sizeVariants.find(size => size.id === this.selectedVariantId(p));
    return variant?.price ?? p.price;
  }
  selectedVariantFinalCost(p: Product) {
    const variant = p.sizeVariants.find(size => size.id === this.selectedVariantId(p));
    return variant?.finalCost ?? p.finalCost;
  }
  selectVariant(p: Product, sizeVariantId: string) { this.selectedSizes[p.id] = sizeVariantId; }
  add(p: Product) {
    if (!this.auth.isAuthenticated) { alert('Please log in before adding products to your cart.'); return; }
    const sizeVariantId = this.selectedVariantId(p);
    if (!sizeVariantId || this.selectedVariantStock(p) < 1) return;
    this.store.addToCart(p.id, sizeVariantId).subscribe({ next: () => alert('Added to your cart.'), error: e => alert(e.error?.message ?? 'Unable to add this product.') });
  }
}
