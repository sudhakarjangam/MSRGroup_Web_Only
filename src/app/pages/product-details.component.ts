import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Product, ProductSizeVariant } from '../core/models';
import { StoreService } from '../core/store.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  styles: [`
    .details-layout { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr); gap:48px; align-items:start; }
    .gallery { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .gallery img, .image-placeholder { width:100%; aspect-ratio:4/5; object-fit:cover; background:#eee7de; border-radius:12px; }
    .image-placeholder { display:grid; place-items:center; color:var(--muted); }
    .product-info { position:sticky; top:24px; }
    .product-info h1 { margin:8px 0 12px; font:500 clamp(32px,4vw,48px)/1.1 'Playfair Display',serif; }
    .category { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:1.4px; }
    .price { display:flex; align-items:baseline; gap:10px; margin:18px 0; font-size:24px; }
    .price del { color:var(--muted); font-size:16px; }
    .description { color:var(--muted); line-height:1.8; white-space:pre-line; }
    .size-select { margin-top:22px; }
    .stock-note { margin:8px 0 18px; color:var(--muted); font-size:13px; }
    .actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:18px; }
    .actions button { min-height:46px; }
    .feedback { margin-top:14px; }
    .back-link { display:inline-block; margin-bottom:22px; color:var(--wine); }
    @media(max-width:760px) {
      .details-layout { grid-template-columns:minmax(0,1fr); gap:24px; }
      .product-info { position:static; }
      .gallery { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media(max-width:460px) {
      .gallery { grid-template-columns:minmax(0,1fr); }
      .actions { grid-template-columns:minmax(0,1fr); }
    }
  `],
  template: `
    <div class="container">
      <a class="back-link" routerLink="/">← Continue shopping</a>
      @if (loading()) {
        <p class="muted">Loading product details…</p>
      } @else if (error() && !product()) {
        <p class="error">{{error()}}</p>
      } @else if (product(); as item) {
        <div class="details-layout">
          <div class="gallery" aria-label="Product images">
            @for(image of images(item); track image) {
              <img [src]="image" [alt]="item.name" loading="lazy">
            } @empty {
              <div class="image-placeholder">No product image available</div>
            }
          </div>
          <section class="product-info">
            <span class="category">{{item.categoryName}}</span>
            <h1>{{item.name}}</h1>
            <p class="muted">SKU: {{item.sku}}</p>
            <div class="price">
              @if (selectedPrice(item) > selectedFinalCost(item)) {
                <del>{{selectedPrice(item) | currency:'INR'}}</del>
              }
              <strong>{{selectedFinalCost(item) | currency:'INR'}}</strong>
            </div>
            <p class="description">{{item.description || 'A thoughtfully selected piece for your collection.'}}</p>
            @if (item.sizeVariants.length) {
              <label class="size-select">Available size
                <select [value]="selectedVariantId()" (change)="selectSize($any($event.target).value)">
                  @for(size of item.sizeVariants; track size.id) {
                    <option [value]="size.id" [disabled]="size.stockQuantity < 1">
                      {{size.size}} — {{(size.finalCost ?? size.price ?? item.finalCost) | currency:'INR'}}{{size.stockQuantity < 1 ? ' · Sold out' : ''}}
                    </option>
                  }
                </select>
              </label>
              <p class="stock-note">{{selectedVariant()?.stockQuantity ?? 0}} available in this size</p>
            } @else {
              <p class="stock-note">Currently unavailable</p>
            }
            <div class="actions">
              <button type="button" (click)="addToCart(item)" [disabled]="busy() || selectedStock() < 1">Add to cart</button>
              <button type="button" class="secondary" (click)="buyNow(item)" [disabled]="busy() || selectedStock() < 1">Add and checkout</button>
            </div>
            @if(error()) { <p class="error feedback">{{error()}}</p> }
            @if(message()) { <p class="feedback">{{message()}} <a routerLink="/cart">View cart</a></p> }
          </section>
        </div>
      }
    </div>
  `
})
export class ProductDetailsComponent implements OnInit {
  product = signal<Product | null>(null);
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  message = signal('');
  selectedVariantId = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: StoreService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Product not found.');
      this.loading.set(false);
      return;
    }
    this.store.product(id).subscribe({
      next: product => {
        this.product.set(product);
        const variant = product.sizeVariants?.find(size => size.stockQuantity > 0) ?? product.sizeVariants?.[0];
        this.selectedVariantId.set(variant?.id ?? '');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load this product. It may no longer be available.');
        this.loading.set(false);
      }
    });
  }

  images(product: Product): string[] {
    return product.imageUrls?.length ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);
  }

  selectedVariant(): ProductSizeVariant | undefined {
    return this.product()?.sizeVariants?.find(size => size.id === this.selectedVariantId());
  }

  selectedStock(): number {
    return this.selectedVariant()?.stockQuantity ?? 0;
  }

  selectedPrice(product: Product): number {
    return this.selectedVariant()?.price ?? product.price;
  }

  selectedFinalCost(product: Product): number {
    return this.selectedVariant()?.finalCost ?? product.finalCost;
  }

  selectSize(id: string) {
    this.selectedVariantId.set(id);
    this.message.set('');
    this.error.set('');
  }

  addToCart(product: Product) {
    this.addSelectedToCart(product, false);
  }

  buyNow(product: Product) {
    this.addSelectedToCart(product, true);
  }

  private addSelectedToCart(product: Product, checkout: boolean) {
    const variantId = this.selectedVariantId();
    if (!this.auth.isAuthenticated) {
      this.error.set('Please log in before adding products to your cart.');
      return;
    }
    if (!variantId || this.selectedStock() < 1) {
      this.error.set('Select an available size.');
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.store.addToCart(product.id, variantId).subscribe({
      next: () => {
        this.busy.set(false);
        if (checkout) {
          this.router.navigateByUrl('/checkout');
          return;
        }
        this.message.set('Added to your cart.');
      },
      error: e => {
        this.busy.set(false);
        this.error.set(e.error?.message ?? 'Unable to add this product.');
      }
    });
  }
}
