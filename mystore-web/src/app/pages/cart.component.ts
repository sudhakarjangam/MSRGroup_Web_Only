import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';
import { Cart } from '../core/models';

@Component({ standalone: true, imports: [CurrencyPipe, RouterLink], template: `
<div class="container">
<h1>Your shopping cart</h1>
@if (cart(); as c) {
  @if (c.items.length) {
    <div class="cart-layout"><div class="panel">
      @for (item of c.items; track item.productId + item.sizeVariantId) {
        <div class="cart-row"><div class="cart-info"><strong>{{ item.name }} · {{item.size}}</strong><span class="muted">{{ item.unitPrice | currency:'INR' }} each · {{ item.availableStock }} available</span></div>
          <input class="qty" type="number" min="1" [max]="item.availableStock" [value]="item.quantity" (change)="update(item.productId, item.sizeVariantId, $any($event.target).value)">
          <strong>{{ item.lineTotal | currency:'INR' }}</strong><button class="danger ghost" (click)="remove(item.productId, item.sizeVariantId)">Remove</button></div>
      }
    </div><aside class="panel summary"><h2>Order summary</h2><div class="summary-line"><span>Items ({{ c.totalItems }})</span><strong>{{ c.subtotal | currency:'INR' }}</strong></div><div class="summary-line total"><span>Subtotal</span><strong>{{ c.subtotal | currency:'INR' }}</strong></div><a class="button wide" routerLink="/checkout">Proceed to checkout</a><p class="muted">Taxes and shipping are calculated at checkout.</p></aside></div>
  } @else { <div class="empty"><h2>Your cart is empty</h2><a href="/">Continue shopping</a></div> }
} @else { <p>Loading cart...</p> }
@if (error()) { <p class="error">{{ error() }}</p> }
</div>
` })
export class CartComponent implements OnInit {
  cart = signal<Cart | null>(null); error = signal('');
  constructor(private store: StoreService) {}
  ngOnInit() { this.load(); }
  load() { this.store.cart().subscribe({ next: x => this.cart.set(x), error: () => this.error.set('Unable to load your cart.') }); }
  update(id: string, sizeVariantId: string, value: string) { const n=Number(value); if (!Number.isInteger(n) || n < 1) return; this.store.updateCart(id, sizeVariantId, n).subscribe({ next: x => this.cart.set(x), error: e => this.error.set(e.error?.message ?? 'Update failed.') }); }
  remove(id: string, sizeVariantId: string) { this.store.removeFromCart(id, sizeVariantId).subscribe({ next: x => this.cart.set(x), error: () => this.error.set('Remove failed.') }); }
}
