import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { StoreService } from '../core/store.service';
import { Order } from '../core/models';

@Component({
  standalone: true, imports: [CurrencyPipe, DatePipe],
  template: `
  <div class="container">
  <div class="section-head"><div><p class="eyebrow">YOUR ACCOUNT</p><h1>Your orders</h1><p class="muted">View order status, payment details and invoices.</p></div></div>
  @if(error()){<p class="error">{{error()}}</p>}
  @for(order of orders();track order.id){
    <article class="panel order-card">
      <div class="order-head"><div><strong>{{order.orderNumber}}</strong><p class="muted">{{order.createdUtc | date:'medium'}}</p></div><span class="status-pill">{{order.status}}</span></div>
      <div class="order-items">@for(item of order.items;track item.productId + item.size){<div><span>{{item.productName}} · {{item.size}} × {{item.quantity}}</span><strong>{{item.lineTotal | currency:'INR'}}</strong></div>}</div>
      <div class="order-total"><span>{{order.paymentMethod}} · {{order.paymentStatus}}</span><strong>{{order.grandTotal | currency:'INR'}}</strong></div>
      @if(order.shipmentAwb){<p class="muted">Courier: {{order.courierName}} · AWB: {{order.shipmentAwb}} @if(order.trackingUrl){· <a [href]="order.trackingUrl" target="_blank" rel="noopener">Track shipment</a>}</p>}
      <button class="secondary small" (click)="downloadInvoice(order)">Print invoice</button>
    </article>
  } @empty { @if(!error()){<div class="empty"><h2>No orders yet</h2><p class="muted">Your completed purchases will appear here.</p></div>} }
  </div>
  `
})
export class OrdersComponent implements OnInit {
  orders=signal<Order[]>([]); error=signal('');
  constructor(private store:StoreService){}
  ngOnInit(){this.store.myOrders().subscribe({next:x=>this.orders.set(x),error:()=>this.error.set('Unable to load your orders.')});}
  downloadInvoice(order:Order){
    this.store.invoice(order.id).subscribe({next:blob=>{
      const url=URL.createObjectURL(blob); const w=window.open(url,'_blank');
      if(!w) { const a=document.createElement('a');a.href=url;a.download=`${order.orderNumber}.html`;a.click(); }
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    },error:()=>this.error.set('Could not generate invoice.')});
  }
}
