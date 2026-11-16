import { firstValueFrom } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Cart, Category, Dashboard, Product, CheckoutAddress, Order, RazorpayCheckout } from './models';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly api = `${environment.apiBaseUrl}/api`;
  constructor(private http: HttpClient) {}
  products(search = '', categoryId = '', pageSize = 100, page = 1) { const params: Record<string, string> = { pageSize: String(pageSize), page: String(page) }; if (search) params['search'] = search; if (categoryId) params['categoryId'] = categoryId; return this.http.get<{items: Product[]; total: number}>(`${this.api}/products`, { params }); }
  product(id: string) { return this.http.get<Product>(`${this.api}/products/${id}`); }
  categories() { return this.http.get<Category[]>(`${this.api}/categories`); }
  createProduct(data: Partial<Product>) { return this.http.post<Product>(`${this.api}/products`, data); }
  updateProduct(id: string, data: Partial<Product>) { return this.http.put<Product>(`${this.api}/products/${id}`, data); }
  deleteProduct(id: string) { return this.http.delete<void>(`${this.api}/products/${id}`); }
  createCategory(data: Partial<Category>) { return this.http.post<Category>(`${this.api}/categories`, data); }
  updateCategory(id: string, data: Partial<Category>) { return this.http.put<Category>(`${this.api}/categories/${id}`, data); }
  deleteCategory(id: string) { return this.http.delete<void>(`${this.api}/categories/${id}`); }
  dashboard() { return this.http.get<Dashboard>(`${this.api}/admin/dashboard`); }
  cart() { return this.http.get<Cart>(`${this.api}/cart`); }
  addToCart(productId: string, sizeVariantId: string, quantity = 1) { return this.http.post<Cart>(`${this.api}/cart/items`, { productId, sizeVariantId, quantity }); }
  updateCart(productId: string, sizeVariantId: string, quantity: number) { return this.http.put<Cart>(`${this.api}/cart/items/${productId}/${sizeVariantId}`, { quantity }); }
  removeFromCart(productId: string, sizeVariantId: string) { return this.http.delete<Cart>(`${this.api}/cart/items/${productId}/${sizeVariantId}`); }
  createRazorpayCheckout(data: CheckoutAddress) { return this.http.post<RazorpayCheckout>(`${this.api}/checkout/razorpay`, data); }
  createCodOrder(data: CheckoutAddress) { return this.http.post<Order>(`${this.api}/checkout/cod`, data); }
  verifyRazorpay(data: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    return this.http.post<{ message: string; orderId: string; orderNumber?: string }>(`${this.api}/payments/razorpay/verify`, data);
  }
  myOrders() { return this.http.get<Order[]>(`${this.api}/orders/mine`); }
  adminOrders(status = '') { return this.http.get<Order[]>(`${this.api}/orders/admin/all`, { params: status ? { status } : {} }); }
  updateOrderStatus(id: string, status: string) { return this.http.put<Order>(`${this.api}/orders/${id}/status`, { status }); }
  markCodPaymentReceived(id: string) { return this.http.post<{message:string}>(`${this.api}/orders/${id}/cod-payment-received`, {}); }
  createShipment(id: string) { return this.http.post<{ shipmentId?: string; awb?: string; courier?: string; status: string }>(`${this.api}/orders/${id}/shiprocket`, {}); }
  invoice(id: string) { return this.http.get(`${this.api}/orders/${id}/invoice`, { responseType: 'blob' }); }

  async uploadProductImage(file: File): Promise<string> {
    const signature = await firstValueFrom(this.http.get<{cloudName:string;apiKey:string;timestamp:number;folder:string;signature:string}>(
      `${this.api}/admin/media/cloudinary-signature`));
    if (!signature) throw new Error('Could not obtain Cloudinary upload signature.');
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('folder', signature.folder);
    form.append('signature', signature.signature);
    const result = await firstValueFrom(this.http.post<{secure_url:string}>(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, form));
    if (!result?.secure_url) throw new Error('Cloudinary did not return an image URL.');
    return result.secure_url;
  }
}
