import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';
import { CheckoutAddress, RazorpayCheckout } from '../core/models';

@Component({
  standalone: true, imports: [FormsModule, CurrencyPipe, RouterLink],
  template: `
  <section class="checkout-shell">
    <div><p class="eyebrow">SECURE CHECKOUT</p><h1>Delivery details</h1><p class="muted">Enter the address where you would like your order delivered.</p></div>
    <form class="panel checkout-form" (ngSubmit)="payOnline()">
      <div class="form-grid">
        <label>Full name *<input name="customerName" [(ngModel)]="form.customerName" required maxlength="160"></label>
        <label>Email *<input type="email" name="customerEmail" [(ngModel)]="form.customerEmail" required></label>
        <label>Phone *<input name="customerPhone" [(ngModel)]="form.customerPhone" required maxlength="30"></label>
        <label>Address line 1 *<input name="addressLine1" [(ngModel)]="form.addressLine1" required></label>
        <label>Address line 2<input name="addressLine2" [(ngModel)]="form.addressLine2"></label>
        <label>City *<input name="city" [(ngModel)]="form.city" required></label>
        <label>State *<input name="state" [(ngModel)]="form.state" required></label>
        <label>PIN code *<input name="postalCode" [(ngModel)]="form.postalCode" required maxlength="20"></label>
        <label>Country<input name="country" [(ngModel)]="form.country" required></label>
        <label>GSTIN (optional)<input name="customerGstin" [(ngModel)]="form.customerGstin"></label>
      </div>
      @if(error){<p class="error">{{error}}</p>}
      <div class="checkout-actions">
        <button type="submit" [disabled]="busy">Pay securely with Razorpay</button>
        <button type="button" class="secondary" [disabled]="busy" (click)="placeCod()">Cash on delivery</button>
        <a routerLink="/cart">Back to cart</a>
      </div>
      <p class="muted small-note">Taxes and shipping are calculated by the server. Do not close this page while payment is being verified.</p>
    </form>
  </section>
  `
})
export class CheckoutComponent {
  form: CheckoutAddress = {
    customerName: '', customerEmail: '', customerPhone: '', addressLine1: '',
    addressLine2: '', city: '', state: '', postalCode: '', country: 'India', customerGstin: ''
  };
  busy = false; error = '';
  constructor(private store: StoreService, private router: Router) {}

  async payOnline() {
    this.busy = true; this.error = '';
    this.store.createRazorpayCheckout(this.form).subscribe({
      next: checkout => this.openRazorpay(checkout),
      error: e => { this.busy = false; this.error = e.error?.message ?? 'Could not start checkout.'; }
    });
  }

  private async openRazorpay(checkout: RazorpayCheckout) {
    try {
      await this.loadRazorpayScript();
      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) throw new Error('Razorpay Checkout could not be loaded.');
      const options = {
        key: checkout.razorpayKeyId,
        amount: checkout.amountPaise,
        currency: checkout.currency,
        name: 'MyStore',
        description: `Order ${checkout.orderNumber}`,
        order_id: checkout.razorpayOrderId,
        prefill: { name: this.form.customerName, email: this.form.customerEmail, contact: this.form.customerPhone },
        notes: { orderNumber: checkout.orderNumber },
        theme: { color: '#16734b' },
        handler: (response: any) => {
          this.store.verifyRazorpay({
            orderId: checkout.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          }).subscribe({
            next: () => { this.busy = false; this.router.navigateByUrl('/orders'); },
            error: e => { this.busy = false; this.error = e.error?.message ?? 'Payment verification failed. Contact support with order ' + checkout.orderNumber; }
          });
        },
        modal: { ondismiss: () => { this.busy = false; this.error = `Payment was not completed. Your order reference is ${checkout.orderNumber}.`; } }
      };
      const payment = new RazorpayCtor(options);
      payment.on('payment.failed', (response: any) => {
        this.busy = false;
        this.error = response.error?.description ?? 'Payment failed. If money was deducted, contact support with your order reference.';
      });
      payment.open();
    } catch (e: any) {
      this.busy = false;
      this.error = e?.message ?? 'Unable to open payment gateway.';
    }
  }

  placeCod() {
    this.busy = true; this.error = '';
    this.store.createCodOrder(this.form).subscribe({
      next: () => { this.busy = false; this.router.navigateByUrl('/orders'); },
      error: e => { this.busy = false; this.error = e.error?.message ?? 'Could not place COD order.'; }
    });
  }

  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load Razorpay Checkout script.'));
      document.body.appendChild(script);
    });
  }
}
