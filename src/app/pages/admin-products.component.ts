import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { StoreService } from '../core/store.service';
import { Category, Product } from '../core/models';

@Component({ standalone: true, imports: [FormsModule, CurrencyPipe], template: `
<div class="container">
<div class="section-head"><div><h1>Products</h1><p class="muted">Create and manage your catalog.</p></div><button (click)="newProduct()">Add product</button></div>
@if (editing) {
  <form class="panel editor" (ngSubmit)="save()"><h2>{{ form.id ? 'Edit product' : 'New product' }}</h2>
    <div class="form-grid"><label>Product name<input name="name" [(ngModel)]="form.name" required></label><label>SKU<input name="sku" [(ngModel)]="form.sku" required></label>
    <label>Default cost (INR)<input type="number" min="0" step="0.01" name="price" [(ngModel)]="form.price" required></label>
    <label>Category<select name="category" [(ngModel)]="form.categoryId" required><option value="">Select category</option>@for(c of categories();track c.id){<option [value]="c.id">{{c.name}}</option>}</select></label>
    <label class="full">Description<textarea name="description" [(ngModel)]="form.description"></textarea></label>
    <fieldset class="full"><legend>Product images (up to 10)</legend>
      <label>Upload images<input type="file" accept="image/*" multiple (change)="onImagesSelected($event)" [disabled]="imageBusy || form.imageUrls.length >= 10"><span class="muted">{{imageBusy ? 'Uploading images...' : 'Optional · JPG, PNG or WebP · max 5 MB each'}}</span></label>
      <div class="image-url-entry"><input name="newImageUrl" aria-label="Image URL" placeholder="Or add an image URL" [(ngModel)]="newImageUrl"><button type="button" class="secondary" (click)="addImageUrl()">Add URL</button></div>
      @for(url of form.imageUrls;track url;let i=$index){<div class="image-row"><img [src]="url" alt="Product image preview"><span>{{url}}</span><button type="button" class="danger small" (click)="removeImage(i)">Remove</button></div>}
    </fieldset>
    <fieldset class="full"><legend>Size options, pricing, and stock</legend>
      <p class="muted">Each size has its own inventory and can override the default cost or discount.</p>
      <div class="variant-list">
      @for(size of form.sizeVariants;track $index;let i=$index){<section class="variant-card">
        <div class="variant-fields">
          <label>Size<input [name]="'size' + i" [(ngModel)]="size.size" required maxlength="40" placeholder="e.g. S, M, L"></label>
          <label>Stock quantity<input type="number" min="0" [name]="'sizeStock' + i" [(ngModel)]="size.stockQuantity" required></label>
          <label>Cost for this size (INR)<input type="number" min="0" step="0.01" [name]="'sizePrice' + i" [(ngModel)]="size.price" placeholder="Default: {{form.price | currency:'INR'}}"></label>
          <label>Discount (%)<input type="number" min="0" max="100" step="0.01" [name]="'sizeDiscount' + i" [(ngModel)]="size.discountPercentage" [placeholder]="defaultDiscountHint" [required]="size.discountFrom || size.discountTo"></label>
          <label>Discount starts<input type="date" [name]="'sizeDiscountFrom' + i" [(ngModel)]="size.discountFrom" [required]="hasVariantDiscount(size)"></label>
          <label>Discount ends<input type="date" [name]="'sizeDiscountTo' + i" [(ngModel)]="size.discountTo" [required]="hasVariantDiscount(size)"></label>
        </div>
        <div class="variant-summary">
          <span>Effective cost: <strong>{{ variantBaseCost(size) | currency:'INR' }}</strong></span>
          <span>Final cost: <strong>{{ variantFinalCost(size) | currency:'INR' }}</strong></span>
          <button type="button" class="danger small" (click)="removeSize(i)" [disabled]="form.sizeVariants.length <= 1">Remove size</button>
        </div>
      </section>}
      </div>
      <button type="button" class="secondary small" (click)="addSize()" [disabled]="form.sizeVariants.length >= 30">Add size</button>
      <p class="muted">Total stock: {{ totalStock }}</p>
    </fieldset>
    </div>
    <div class="actions"><button [disabled]="busy || imageBusy">Save product</button><button type="button" class="secondary" (click)="editing=false">Cancel</button></div>
    @if(error){<p class="error">{{error}}</p>}
  </form>
}
<div class="panel table-wrap"><table class="admin-product-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Size pricing</th><th>Total stock</th><th>Actions</th></tr></thead><tbody>
@for(p of products();track p.id){<tr><td>{{p.name}}</td><td>{{p.sku}}</td><td>{{p.categoryName}}</td><td><div class="variant-price-list">@for(size of p.sizeVariants;track size.id){<span><b>{{size.size}}</b>: @if((size.price ?? p.price) > (size.finalCost ?? p.finalCost)){<del>{{(size.price ?? p.price)|currency:'INR'}}</del> }{{(size.finalCost ?? p.finalCost)|currency:'INR'}}</span>}</div></td><td>{{p.stockQuantity}}</td><td><div class="actions"><button class="small secondary" (click)="edit(p)">Edit</button><button class="small danger" (click)="remove(p)">Deactivate</button></div></td></tr>}
</tbody></table></div>
</div>
`, styles: [`
  :host { display:block; min-width:0; }
  .editor, .editor .form-grid, .editor fieldset, .variant-list, .variant-card { min-width:0; max-width:100%; }
  .editor { width:100%; overflow:hidden; }
  .editor fieldset { width:100%; margin:12px 0; }
  .editor label, .variant-fields label { min-width:0; }
  .editor input, .editor select, .editor textarea { min-width:0; max-width:100%; }
  .variant-list { display:grid; gap:12px; }
  .variant-card { border:1px solid var(--line); border-radius:8px; padding:14px; background:#fcfaf7; }
  .variant-fields { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0 16px; width:100%; }
  .variant-summary { display:flex; align-items:center; gap:20px; flex-wrap:wrap; padding-top:8px; border-top:1px solid var(--line); font-size:13px; }
  .variant-summary button { margin-left:auto; }
  .variant-price-list { display:grid; gap:4px; }
  .variant-price-list span { font-size:12px; overflow-wrap:anywhere; }
  .image-url-entry { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:10px; }
  .image-row { display:flex; align-items:center; gap:12px; min-width:0; width:100%; }
  .image-row img { width:54px; height:54px; flex:0 0 54px; object-fit:cover; }
  .image-row span { flex:1; min-width:0; overflow-wrap:anywhere; }
  .admin-product-table { width:100%; min-width:0; table-layout:fixed; }
  .admin-product-table th, .admin-product-table td { white-space:normal; overflow-wrap:anywhere; }
  .admin-product-table .actions { flex-wrap:wrap; }
  @media(max-width:960px) { .variant-fields { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media(max-width:560px) {
    .variant-fields { grid-template-columns:minmax(0,1fr); }
    .variant-card { padding:10px; }
    .variant-summary { gap:10px; }
    .variant-summary button { margin-left:0; }
    .image-url-entry { grid-template-columns:minmax(0,1fr); }
  }
` ] })
export class AdminProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  editing = false;
  busy = false;
  imageBusy = false;
  error = '';
  newImageUrl = '';
  form: any = this.empty();

  constructor(private store: StoreService) {}

  ngOnInit() {
    this.load();
    this.store.categories().subscribe(x => this.categories.set(x));
  }

  get totalStock(): number {
    return this.form.sizeVariants.reduce((sum: number, size: { stockQuantity: number }) => sum + Number(size.stockQuantity || 0), 0);
  }

  get defaultDiscountHint(): string {
    return this.form.discountPercentage ? `Product default: ${this.form.discountPercentage}%` : 'Optional';
  }

  hasVariantDiscount(size: { discountPercentage?: number | string | null; discountFrom?: string | null; discountTo?: string | null }): boolean {
    return size.discountPercentage !== null && size.discountPercentage !== undefined && size.discountPercentage !== '' ||
      !!size.discountFrom || !!size.discountTo;
  }

  variantBaseCost(size: { price?: number | string | null }): number {
    return size.price === '' || size.price == null ? Number(this.form.price) || 0 : Number(size.price);
  }

  variantFinalCost(size: { price?: number | string | null; discountPercentage?: number | string | null; discountFrom?: string | null; discountTo?: string | null }): number {
    const price = this.variantBaseCost(size);
    const discount = size.discountPercentage === '' || size.discountPercentage == null
      ? Number(this.form.discountPercentage) || 0 : Number(size.discountPercentage);
    const from = size.discountPercentage === '' || size.discountPercentage == null
      ? this.form.discountFrom : size.discountFrom;
    const to = size.discountPercentage === '' || size.discountPercentage == null
      ? this.form.discountTo : size.discountTo;
    const today = new Date().toISOString().slice(0, 10);
    if (!discount || !from || !to || today < from || today > to) return price;
    return Math.round((price * (1 - discount / 100) + Number.EPSILON) * 100) / 100;
  }

  empty() {
    return {
      id: '', name: '', sku: '', description: '', price: 0, stockQuantity: 0, categoryId: '',
      imageUrl: '', imageUrls: [] as string[], isActive: true,
      sizeVariants: [{ size: 'One size', stockQuantity: 0, price: null, discountPercentage: null, discountFrom: null, discountTo: null }],
      discountPercentage: null as number | null, discountFrom: null as string | null, discountTo: null as string | null
    };
  }

  load() { this.store.products().subscribe(x => this.products.set(x.items)); }
  newProduct() { this.form = this.empty(); this.editing = true; this.error = ''; this.newImageUrl = ''; }
  edit(p: Product) {
    this.form = { ...p, imageUrls: [...(p.imageUrls ?? (p.imageUrl ? [p.imageUrl] : []))],
      sizeVariants: p.sizeVariants.map(size => ({ ...size })) };
    this.editing = true;
    this.error = '';
    this.newImageUrl = '';
  }

  save() {
    const discount = this.form.discountPercentage === '' || this.form.discountPercentage == null
      ? null : Number(this.form.discountPercentage);
    if (discount !== null && (!this.form.discountFrom || !this.form.discountTo)) {
      this.error = 'Enter both discount start and end dates.';
      return;
    }
    this.busy = true;
    this.error = '';
    const payload = {
      ...this.form,
      price: Number(this.form.price),
      stockQuantity: this.totalStock,
      imageUrl: this.form.imageUrls[0] ?? null,
      imageUrls: this.form.imageUrls,
      sizeVariants: this.form.sizeVariants.map((size: { id?: string; size: string; stockQuantity: number; price?: number | null; discountPercentage?: number | null; discountFrom?: string | null; discountTo?: string | null }) => ({
        id: size.id ?? null, size: size.size.trim(), stockQuantity: Number(size.stockQuantity),
        price: this.optionalNumber(size.price),
        discountPercentage: this.optionalNumber(size.discountPercentage),
        discountFrom: this.optionalNumber(size.discountPercentage) === null ? null : this.optionalDate(size.discountFrom),
        discountTo: this.optionalNumber(size.discountPercentage) === null ? null : this.optionalDate(size.discountTo)
      })),
      discountPercentage: discount,
      discountFrom: discount === null ? null : this.form.discountFrom,
      discountTo: discount === null ? null : this.form.discountTo
    };
    const call = this.form.id
      ? this.store.updateProduct(this.form.id, payload)
      : this.store.createProduct(payload);
    call.subscribe({
      next: () => { this.busy = false; this.editing = false; this.load(); },
      error: e => { this.busy = false; this.error = e.error?.message ?? 'Save failed.'; }
    });
  }

  private optionalNumber(value: number | string | null | undefined): number | null {
    if (value === '' || value == null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private optionalDate(value: string | null | undefined): string | null {
    return value?.trim() || null;
  }

  async onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    if (this.form.imageUrls.length + files.length > 10) {
      this.error = 'A product can have up to 10 images.';
      input.value = '';
      return;
    }
    const invalid = files.find(file => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024);
    if (invalid) {
      this.error = invalid.size > 5 * 1024 * 1024 ? 'Each image must be 5 MB or smaller.' : 'Select image files only.';
      input.value = '';
      return;
    }
    this.imageBusy = true;
    this.error = '';
    try {
      const urls = await Promise.all(files.map(file => this.store.uploadProductImage(file)));
      this.form.imageUrls.push(...urls);
      this.form.imageUrl = this.form.imageUrls[0] ?? '';
    } catch (e: any) {
      this.error = e?.error?.message ?? e?.message ?? 'Image upload failed. Check Cloudinary settings.';
    } finally {
      this.imageBusy = false;
      input.value = '';
    }
  }

  addImageUrl() {
    const url = this.newImageUrl.trim();
    if (!url) return;
    if (this.form.imageUrls.length >= 10) { this.error = 'A product can have up to 10 images.'; return; }
    this.form.imageUrls.push(url);
    this.form.imageUrl = this.form.imageUrls[0];
    this.newImageUrl = '';
    this.error = '';
  }

  removeImage(index: number) {
    this.form.imageUrls.splice(index, 1);
    this.form.imageUrl = this.form.imageUrls[0] ?? '';
  }

  addSize() { this.form.sizeVariants.push({ size: '', stockQuantity: 0, price: null, discountPercentage: null, discountFrom: null, discountTo: null }); }

  removeSize(index: number) {
    if (this.form.sizeVariants.length > 1) this.form.sizeVariants.splice(index, 1);
  }

  remove(p: Product) {
    if (!confirm(`Deactivate ${p.name}?`)) return;
    this.store.deleteProduct(p.id).subscribe({ next: () => this.load(), error: () => this.error = 'Could not deactivate product.' });
  }
}
