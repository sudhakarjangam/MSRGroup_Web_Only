export interface User { id: string; email: string | null; mobileNumber: string | null; displayName: string; role: 'Admin' | 'Customer'; }
export interface AuthResponse { accessToken: string; user: User; }
export interface ProductSizeVariant { id?: string; size: string; stockQuantity: number; price?: number | null; discountPercentage?: number | null; discountFrom?: string | null; discountTo?: string | null; finalCost?: number; }
export interface Product { id: string; name: string; slug: string; sku: string; description: string; price: number; finalCost: number; discountPercentage?: number | null; discountFrom?: string | null; discountTo?: string | null; stockQuantity: number; sizeVariants: ProductSizeVariant[]; categoryId: string; categoryName: string; imageUrl?: string | null; imageUrls: string[]; isActive: boolean; }
export interface Category { id: string; name: string; slug: string; description?: string | null; isActive: boolean; }
export interface CartItem { productId: string; sizeVariantId: string; size: string; name: string; imageUrl?: string | null; unitPrice: number; quantity: number; lineTotal: number; availableStock: number; }
export interface Cart { items: CartItem[]; totalItems: number; subtotal: number; }
export interface Dashboard { productCount: number; categoryCount: number; customerCount: number; activeCartCount: number; lowStockCount: number; }

export interface CheckoutAddress {
  customerName: string; customerEmail: string; customerPhone: string;
  addressLine1: string; addressLine2?: string; city: string; state: string;
  postalCode: string; country: string; customerGstin?: string;
}
export interface OrderItem {
  productId: string; productName: string; sku: string; size: string; unitPrice: number;
  quantity: number; lineTotal: number;
}
export interface Order {
  id: string; orderNumber: string; status: string; paymentMethod: string; paymentStatus: string;
  subtotal: number; taxRatePercent: number; taxAmount: number; shippingAmount: number;
  grandTotal: number; currency: string; customerName: string; customerEmail: string;
  customerPhone: string; addressLine1: string; addressLine2?: string; city: string; state: string;
  postalCode: string; country: string; customerGstin?: string; shipmentAwb?: string;
  courierName?: string; trackingUrl?: string; createdUtc: string; items: OrderItem[];
}
export interface RazorpayCheckout {
  orderId: string; orderNumber: string; razorpayOrderId: string; razorpayKeyId: string;
  amountPaise: number; currency: string; subtotal: number; taxAmount: number;
  shippingAmount: number; grandTotal: number;
}
