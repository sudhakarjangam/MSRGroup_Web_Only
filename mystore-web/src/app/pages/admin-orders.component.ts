import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../core/store.service';
import { Order } from '../core/models';

@Component({
  standalone:true, imports:[CurrencyPipe,DatePipe,FormsModule],
  template:`
  <div class="container">
  <div class="section-head"><div><h1>Orders</h1><p class="muted">Review orders, update fulfillment and create shipments.</p></div>
    <select class="filter-select" [(ngModel)]="filter" (ngModelChange)="load()"><option value="">All statuses</option><option>PendingPayment</option><option>Confirmed</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>PaymentFailed</option><option>Cancelled</option></select>
  </div>
  @if(error){<p class="error">{{error}}</p>}
  <div class="panel table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>
  @for(o of orders();track o.id){<tr><td><strong>{{o.orderNumber}}</strong><br><span class="muted">{{o.items.length}} line(s)</span></td><td>{{o.customerName}}<br><span class="muted">{{o.customerEmail}}</span></td><td>{{o.createdUtc|date:'short'}}</td><td>{{o.grandTotal|currency:'INR'}}</td><td>{{o.paymentMethod}} / {{o.paymentStatus}}</td><td><select [ngModel]="o.status" (ngModelChange)="updateStatus(o,$event)"><option>Confirmed</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></td><td><button class="small secondary" (click)="shipment(o)" [disabled]="!!o.shipmentAwb">Create shipment</button>
    @if(o.paymentMethod==='COD' && o.paymentStatus!=='Paid'){<button class="small" (click)="markCodPaid(o)">Mark COD paid</button>}</td></tr>}
  </tbody></table></div>
  </div>
  `
})
export class AdminOrdersComponent implements OnInit {
  orders=signal<Order[]>([]);filter='';error='';
  constructor(private store:StoreService){}
  ngOnInit(){this.load();}
  load(){this.store.adminOrders(this.filter).subscribe({next:x=>this.orders.set(x),error:()=>this.error='Unable to load orders.'});}
  updateStatus(order:Order,status:string){
    if(status==='Cancelled' && !confirm(`Cancel ${order.orderNumber}?`)) { this.load(); return; }
    this.store.updateOrderStatus(order.id,status).subscribe({next:()=>this.load(),error:e=>{this.error=e.error?.message??'Could not update status.';this.load();}});
  }
  markCodPaid(order:Order){
    this.store.markCodPaymentReceived(order.id).subscribe({next:()=>this.load(),error:e=>this.error=e.error?.message??'Could not update COD payment.'});
  }
  shipment(order:Order){
    this.store.createShipment(order.id).subscribe({next:()=>this.load(),error:e=>this.error=e.error?.message??'Shipment creation failed. Check Shiprocket configuration.'});
  }
}
