import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';
import { Dashboard } from '../core/models';

@Component({ standalone: true, imports: [RouterLink], template: `
<div class="container">
<div class="section-head"><div><p class="eyebrow">STORE MANAGEMENT</p><h1>Admin dashboard</h1><p class="muted">Overview of your store.</p></div><div class="actions"><a class="button" routerLink="/admin/products">Manage products</a><a class="button secondary" routerLink="/admin/categories">Manage categories</a><a class="button secondary" routerLink="/admin/orders">Manage orders</a></div></div>
@if (stats(); as s) { <div class="stats-grid">
  <article class="stat"><span>Active products</span><strong>{{ s.productCount }}</strong></article>
  <article class="stat"><span>Categories</span><strong>{{ s.categoryCount }}</strong></article>
  <article class="stat"><span>Customers</span><strong>{{ s.customerCount }}</strong></article>
  <article class="stat"><span>Active carts</span><strong>{{ s.activeCartCount }}</strong></article>
  <article class="stat warning"><span>Low stock (≤ 5)</span><strong>{{ s.lowStockCount }}</strong></article>
</div> } @else { <p>{{ error() || 'Loading dashboard...' }}</p> }
<p class="notice">Open Orders to review purchases, update fulfillment and arrange courier shipments.</p>
 </div>
` })
export class AdminDashboardComponent implements OnInit {
  stats=signal<Dashboard|null>(null); error=signal('');
  constructor(private store: StoreService) {}
  ngOnInit() { this.store.dashboard().subscribe({next:x=>this.stats.set(x),error:()=>this.error.set('Unable to load dashboard metrics.')}); }
}
