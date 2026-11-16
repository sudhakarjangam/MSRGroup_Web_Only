import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { HomeSearchService } from '../core/home-search.service';
import { Product, ProductSizeVariant } from '../core/models';
import { StoreService } from '../core/store.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  styles: [`
    .search-results { padding: 38px 0 56px; }
    .results-heading { margin-bottom: 24px; }
    .results-heading h1 { margin: 6px 0; font: 500 clamp(30px,4vw,42px)/1.1 'Playfair Display',serif; }
    .results-heading p { color: var(--muted); }
    .product-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:20px; }
    .product-card { min-width:0; padding:14px; border:1px solid var(--line); border-radius:16px; background:#fff; box-shadow:0 4px 16px #29231f0a; transition:transform .2s ease, box-shadow .2s ease; }
    .product-card:hover { transform:translateY(-3px); box-shadow:0 12px 26px #29231f16; }
    .product-image { display:block; overflow:hidden; aspect-ratio:4/5; border-radius:11px; background:#eee7de; }
    .product-image img { width:100%; height:100%; object-fit:cover; transition:transform .35s ease; }
    .product-image:hover img { transform:scale(1.035); }
    .image-placeholder { display:grid; width:100%; height:100%; place-items:center; color:var(--muted); }
    .product-category { display:block; margin-top:14px; color:var(--muted); font-size:11px; letter-spacing:1px; text-transform:uppercase; }
    .product-name { display:block; min-height:2.5em; margin:5px 0 8px; color:var(--ink); font-size:16px; font-weight:600; line-height:1.25; }
    .product-price { display:flex; gap:8px; align-items:baseline; }
    .product-price del { color:var(--muted); font-size:13px; }
    .variant-select { display:block; width:100%; margin-top:12px; padding:9px 10px; border:1px solid var(--line); border-radius:8px; background:#fbf9f5; color:var(--ink); }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    .product-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
    .product-actions a, .product-actions button { min-width:0; min-height:38px; display:flex; align-items:center; justify-content:center; padding:8px 10px; border:1px solid var(--wine); border-radius:8px; background:var(--wine); color:#fff; font-size:12px; font-weight:600; text-align:center; text-decoration:none; cursor:pointer; }
    .product-actions a { background:transparent; color:var(--wine); }
    .product-actions a:hover { background:#f7f0eb; }
    .product-actions button:hover:not(:disabled) { background:#683b3b; }
    .product-actions button:disabled { opacity:.55; cursor:not-allowed; }
    .cart-feedback { margin:8px 0 0; font-size:12px; }
    .cart-feedback.error { color:#9c3d3d; }
    .cart-feedback a { color:inherit; text-decoration:underline; }
    .empty-state { padding:36px 20px; border:1px solid var(--line); border-radius:14px; color:var(--muted); text-align:center; }
    @media(max-width:900px) { .product-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; } }
    @media(max-width:650px) {
      .search-results { padding:26px 0 40px; }
      .product-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px 10px; }
      .product-card { padding:9px; border-radius:12px; }
      .product-name { font-size:14px; }
      .product-actions { grid-template-columns:1fr; }
    }
  `],
  template: `
    <section class="container search-results">
      <header class="results-heading">
        <span class="section-kicker">{{categoryName() ? 'SHOP BY COLLECTION' : 'PRODUCT SEARCH'}}</span>
        <h1>{{categoryName() || 'Search results'}}</h1>
        @if (searchTerm()) { <p>Showing products matching “{{searchTerm()}}”.</p> }
        @else if (categoryName()) { <p>Products in this collection.</p> }
      </header>

      @if (loading()) {
        <p class="muted" role="status">Loading matching products…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{error()}}</p>
      } @else if (products().length) {
        <p class="muted">{{products().length}} product{{products().length === 1 ? '' : 's'}} found</p>
        <div class="product-grid">
          @for (product of products(); track product.id) {
            <article class="product-card">
              <a class="product-image" [routerLink]="['/products', product.id]" target="_blank" rel="noopener" [attr.aria-label]="'View ' + product.name">
                @if (product.imageUrls.length || product.imageUrl) {
                  <img [src]="product.imageUrls[0] || product.imageUrl" [alt]="product.name" loading="lazy">
                } @else {
                  <span class="image-placeholder">No image available</span>
                }
              </a>
              <span class="product-category">{{product.categoryName}}</span>
              <a class="product-name" [routerLink]="['/products', product.id]" target="_blank" rel="noopener">{{product.name}}</a>
              <div class="product-price">
                @if (selectedPrice(product) > selectedFinalCost(product)) { <del>{{selectedPrice(product) | currency:'INR'}}</del> }
                <strong>{{selectedFinalCost(product) | currency:'INR'}}</strong>
              </div>
              @if (product.sizeVariants.length) {
                <label class="sr-only" [attr.for]="'size-' + product.id">Choose size for {{product.name}}</label>
                <select class="variant-select" [id]="'size-' + product.id" [value]="selectedVariantId(product)" (change)="selectVariant(product, $event)">
                  @for (size of product.sizeVariants; track size.id) {
                    <option [value]="size.id" [disabled]="size.stockQuantity < 1">{{size.size}} — {{(size.finalCost ?? size.price ?? product.finalCost) | currency:'INR'}}{{size.stockQuantity < 1 ? ' · Sold out' : ''}}</option>
                  }
                </select>
              }
              <div class="product-actions">
                <a [routerLink]="['/products', product.id]" target="_blank" rel="noopener">View details</a>
                <button type="button" (click)="addToCart(product)" [disabled]="cartBusy[product.id] || selectedStock(product) < 1">
                  {{cartBusy[product.id] ? 'Adding…' : (selectedStock(product) < 1 ? 'Unavailable' : 'Add to cart')}}
                </button>
              </div>
              @if (cartErrors[product.id]) {
                <p class="cart-feedback error">{{cartErrors[product.id]}} @if (!auth.isAuthenticated) { <a routerLink="/login">Sign in</a> }</p>
              } @else if (cartMessages[product.id]) {
                <p class="cart-feedback">{{cartMessages[product.id]}} <a routerLink="/cart">View cart</a></p>
              }
            </article>
          }
        </div>
      } @else {
        <div class="empty-state">No matching products found. Try a different search.</div>
      }
    </section>
  `
})
export class SearchResultsComponent implements OnInit {
  products = signal<Product[]>([]);
  searchTerm = signal('');
  categoryName = signal('');
  loading = signal(true);
  error = signal('');
  selectedSizes: Record<string, string> = {};
  cartBusy: Record<string, boolean> = {};
  cartMessages: Record<string, string> = {};
  cartErrors: Record<string, string> = {};

  constructor(
    private route: ActivatedRoute,
    private store: StoreService,
    private homeSearch: HomeSearchService,
    public auth: AuthService
  ) {}

  selectedVariantId(product: Product): string {
    return this.selectedSizes[product.id]
      ?? product.sizeVariants.find(size => size.stockQuantity > 0)?.id
      ?? product.sizeVariants[0]?.id
      ?? '';
  }

  selectedVariant(product: Product): ProductSizeVariant | undefined {
    return product.sizeVariants.find(size => size.id === this.selectedVariantId(product));
  }

  selectedStock(product: Product): number {
    return this.selectedVariant(product)?.stockQuantity ?? 0;
  }

  selectedPrice(product: Product): number {
    return this.selectedVariant(product)?.price ?? product.price;
  }

  selectedFinalCost(product: Product): number {
    return this.selectedVariant(product)?.finalCost ?? product.finalCost;
  }

  selectVariant(product: Product, event: Event) {
    this.selectedSizes[product.id] = (event.target as HTMLSelectElement).value;
    this.cartMessages[product.id] = '';
    this.cartErrors[product.id] = '';
  }

  addToCart(product: Product) {
    const variantId = this.selectedVariantId(product);
    if (!this.auth.isAuthenticated) {
      this.cartErrors[product.id] = 'Sign in to add this product to your cart.';
      return;
    }
    if (!variantId || this.selectedStock(product) < 1) {
      this.cartErrors[product.id] = 'Select an available size.';
      return;
    }

    this.cartBusy[product.id] = true;
    this.cartMessages[product.id] = '';
    this.cartErrors[product.id] = '';
    this.store.addToCart(product.id, variantId).subscribe({
      next: () => {
        this.cartBusy[product.id] = false;
        this.cartMessages[product.id] = 'Added to your cart.';
      },
      error: response => {
        this.cartBusy[product.id] = false;
        this.cartErrors[product.id] = response.error?.message ?? 'Unable to add this product.';
      }
    });
  }

  ngOnInit() {
    this.route.queryParamMap.pipe(
      map(params => ({
        query: params.get('q')?.trim() ?? '',
        categoryId: params.get('categoryId') ?? '',
        categoryName: params.get('categoryName') ?? ''
      })),
      tap(({query, categoryName}) => {
        this.searchTerm.set(query);
        this.categoryName.set(categoryName);
        this.loading.set(true);
        this.error.set('');
        this.products.set([]);
        if (this.homeSearch.query() !== query) this.homeSearch.setQuery(query);
      }),
      switchMap(({query, categoryId}) => this.store.products(query, categoryId, 100, 1).pipe(
        switchMap(firstPage => {
          const pageCount = Math.ceil(firstPage.total / 100);
          if (pageCount <= 1) return of(firstPage.items);
          const remainingPages = Array.from({length: pageCount - 1}, (_, index) =>
            this.store.products(query, categoryId, 100, index + 2).pipe(map(page => page.items))
          );
          return forkJoin(remainingPages).pipe(map(pages => [...firstPage.items, ...pages.flat()]));
        }),
        catchError(() => of(null))
      ))
    ).subscribe(results => {
      this.loading.set(false);
      if (results === null) {
        this.error.set('Unable to load search results. Please try again.');
        return;
      }
      this.products.set(results);
    });
  }
}
