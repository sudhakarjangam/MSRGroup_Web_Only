import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Category, Product } from './core/models';
import { AuthService } from './core/auth.service';
import { HomeSearchService, SearchSuggestion } from './core/home-search.service';
import { StoreService } from './core/store.service';
import { Subject, Subscription, catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  styles: [`
    :host .site-header { width: 100%; max-width: none; height: auto; display: block; padding: 0; }
    .home-search-section { width: 100%; display: flex; align-items: center; gap: 20px; padding: 2px 24px; background: #463633; border-bottom: 1px solid #5b4844; }
    .search-brand { flex: 0 0 auto; display: flex; align-items: center; }
    .search-brand img { display: block; width: 90px; height: 60px; object-fit: contain; }
    .home-search-control { position: relative; flex: 1 1 0; width: 100%; min-width: 0; }
    .home-search-box { position: relative; width: 100%; height: 42px; display: flex; align-items: center; gap: 10px; padding: 0 90px 0 14px; border: 1px solid #806c64; border-radius: 24px; background: #463633; color: #f6eee5; }
    .home-search-box label { display:flex; flex:1; min-width:0; align-items:center; gap:10px; }
    .home-search-box span { font-size: 22px; }
    .home-search-box input { width: 100%; min-width:0; border: 0; outline: 0; background: transparent; color: #f6eee5; font: inherit; font-size: 13px; }
    .home-search-box input::placeholder { color: #d2c2b7; }
    .search-submit { position:absolute; top:5px; right:6px; height:30px; padding:0 13px; border-radius:18px; background:#f1e9dd; color:#463633; font-size:11px; }
    .search-suggestions { position: absolute; z-index: 30; top: calc(100% + 7px); left: 0; right: 0; max-height: 360px; overflow-y: auto; padding: 7px; border: 1px solid #d8ccc0; border-radius: 12px; background: #fbf9f5; box-shadow: 0 12px 28px #29231f24; }
    .search-suggestion { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 12px; border: 0; border-radius: 7px; background: transparent; color: #29231f; text-align: left; }
    .search-suggestion:hover, .search-suggestion:focus-visible { background: #eee5d9; }
    .search-suggestion small { flex: 0 0 auto; color: #837a70; font-size: 11px; }
    .search-suggestions p { margin: 8px 12px; color: #837a70; font-size: 12px; }
    .search-suggestions p.error { color: #9c3d3d; }
    .home-search-section .header-actions { flex: 0 0 auto; margin-left: auto; }
    .account-menu-wrap { position:relative; }
    .header-actions .account-menu-wrap .header-greeting { display:inline-flex; align-items:center; gap:9px; max-width:none; padding:8px 12px; border:1px solid #806c64; border-radius:22px; background:#574440; color:#f6eee5; font:inherit; white-space:nowrap; cursor:pointer; transition:background .18s ease,border-color .18s ease; }
    .header-actions .account-menu-wrap .header-greeting:hover,
    .header-actions .account-menu-wrap .header-greeting[aria-expanded="true"] { border-color:#d6b99c; background:#68524d; }
    .header-actions .account-menu-wrap .header-greeting:focus-visible { outline:2px solid #d6b99c; outline-offset:2px; }
    .header-greeting::after { content:'⌄'; color:#d6b99c; font-size:13px; transition:transform .18s ease; }
    .header-greeting[aria-expanded="true"]::after { transform:rotate(180deg); }
    .account-menu { position:absolute; z-index:40; top:calc(100% + 8px); right:0; min-width:210px; display:flex; flex-direction:column; gap:4px; padding:8px; border:1px solid #d8ccc0; border-radius:14px; background:#fbf9f5; box-shadow:0 14px 32px #29231f30; }
    .account-menu a, .account-menu button { width:100%; min-height:40px; display:flex; align-items:center; padding:9px 12px; border:1px solid #e8dfd5; border-radius:9px; background:#fff; color:#463633; font-size:13px; font-weight:500; text-align:left; text-decoration:none; white-space:nowrap; transition:background .18s ease,border-color .18s ease,color .18s ease; }
    .account-menu a:hover, .account-menu button:hover, .account-menu a:focus-visible, .account-menu button:focus-visible { border-color:#cdb8a5; background:#f2e9df; color:#573a36; outline:none; }
    .account-menu button { margin-top:4px; border-color:#ead6d2; color:#8c3f3b; }
    .account-menu button:hover, .account-menu button:focus-visible { border-color:#d6aaa3; background:#f8eae8; color:#71322e; }
    .site-header-main { width: 100%; height: 40px; margin-bottom: 3px; padding: 3px max(calc((100% - 1320px)/2),5.2%); display: flex; align-items: center; justify-content: space-between; background: #574440; }
    .site-header-main .main-nav { display: flex; height: 100%; align-items: center; gap:24px; }
    .main-nav a { font-size: 15px; color: #f6eee5; white-space:nowrap; }
    .main-nav a:hover, .main-nav a.active { color: #d6b99c; }
    .main-nav a.active { font-weight: 700; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 6px; }
    .header-actions .header-greeting, .header-actions .header-text-action, .header-actions .bag-link small { font-size: 16px; color: #f6eee5; letter-spacing: .15px; }
    .header-actions .header-greeting { color: #d6b99c; }
    .header-actions .header-text-action:hover, .header-actions .bag-link:hover small { color: #d6b99c; }
    .site-footer .footer-column b { font-size: 11px; }
    .site-footer .footer-column a { font-size: 13px; }
    .site-footer .footer-note > span { font-size: 9px; }
    @media (max-width: 900px) { .site-header-main { padding: 0 24px; } }
    @media (max-width: 650px) {
      .home-search-section { gap: 10px; padding: 2px 15px; }
      .home-search-control { flex-basis:0; }
      .search-brand img { width: 64px; height: 48px; }
      .home-search-box { height: 38px; padding: 0 74px 0 10px; }
      .home-search-box input { font-size: 11px; }
      .search-submit { top:4px; right:5px; height:28px; padding:0 10px; font-size:10px; }
      .home-search-section .header-actions { gap: 10px; }
      .header-greeting { font-size:12px; }
      .header-actions .account-menu-wrap .header-greeting { max-width:none; padding:7px 9px; font-size:12px; }
      .account-menu { min-width:185px; }
      .home-search-section .bag-link { min-width: auto; padding-left: 8px; }
      .site-header-main { height:auto; min-height:40px; padding: 2px 15px; overflow-x:auto; }
      .site-header-main .main-nav { min-height:36px; gap:16px; }
      .main-nav a { font-size:13px; }
    }
  `],
  template: `
    <!-- <div class="announcement-bar">A LITTLE MORE BEAUTY IN EVERYDAY <span>✳</span> COMPLIMENTARY SHIPPING ON SELECT ORDERS</div> -->
    <header class="site-header">
      <section class="home-search-section" aria-label="Product search">
        <a class="search-brand" routerLink="/" aria-label="MyStore home"><img src="/images/MSRLogo.jpeg" alt="MSR Wears logo" width="90" height="60" /></a>
        <div class="home-search-control">
          <div class="home-search-box">
            <label><span>⌕</span><input [ngModel]="homeSearch.query()" (ngModelChange)="onSearchChange($event)" (focus)="suggestionsOpen = homeSearch.query().trim().length >= 3" (keydown.enter)="searchProducts()" (keydown.escape)="closeSuggestions()" placeholder="Search products and collections" aria-label="Search products and collections" aria-autocomplete="list" [attr.aria-expanded]="suggestionsOpen"></label>
            <button type="button" class="search-submit" (click)="searchProducts()">Search</button>
          </div>
          @if (suggestionsOpen && homeSearch.query().trim().length >= 3) {
            <div class="search-suggestions" role="listbox" aria-label="Search suggestions">
              @for (suggestion of suggestions; track suggestion.kind + suggestion.id) {
                <button type="button" class="search-suggestion" role="option" (click)="selectSuggestion(suggestion)">
                  <span>{{ suggestion.label }}</span><small>{{ suggestion.detail }}</small>
                </button>
              } @empty {
                @if (suggestionsLoading) { <p>Searching…</p> }
                @else if (suggestionsError) { <p class="error">Suggestions could not be loaded. Try again.</p> }
                @else { <p>No matching products or collections.</p> }
              }
            </div>
          }
        </div>
        <div class="header-actions">
          @if (auth.currentUser(); as user) {
            <div class="account-menu-wrap">
              <button type="button" class="header-greeting" aria-haspopup="true" [attr.aria-expanded]="accountMenuOpen" (click)="toggleAccountMenu()" (keydown.escape)="closeAccountMenu()">Hello, {{ user.displayName }}</button>
              @if (accountMenuOpen) {
                <nav class="account-menu" aria-label="Account navigation">
                  <a routerLink="/orders" (click)="closeAccountMenu()">My orders</a>
                  @if (auth.isAdmin) {
                    <a routerLink="/admin" (click)="closeAccountMenu()">Dashboard</a>
                    <a routerLink="/admin/products" (click)="closeAccountMenu()">Products</a>
                    <a routerLink="/admin/orders" (click)="closeAccountMenu()">Orders</a>
                  }
                  <button type="button" (click)="logout()">Sign out</button>
                </nav>
              }
            </div>
          } @else { <a class="header-text-action" routerLink="/login">Sign in</a> }
          <a class="bag-link" routerLink="/cart" aria-label="Shopping cart"><span>♧</span><small>Cart</small></a>
        </div>
      </section>
      <div class="site-header-main">
        <nav class="main-nav" aria-label="Main navigation">
          <a routerLink="/" fragment="collections" routerLinkActive="active" [routerLinkActiveOptions]="linkMatchOptions">Home</a> <!-- <a routerLink="/" fragment="products" routerLinkActive="active" [routerLinkActiveOptions]="linkMatchOptions">Shop all</a> -->
          @for (category of categories.slice(0, 5); track category.id) {
            <a routerLink="/search" [queryParams]="{q: category.name}" routerLinkActive="active" [attr.aria-label]="'Shop ' + category.name">{{category.name}}</a>
          }
        </nav>
      </div>
    </header>
    <main><router-outlet /></main>
    <footer class="site-footer">
      <div class="footer-main">
        <div class="footer-brand"><a class="brand-lockup" routerLink="/"><img src="/images/MSRLogo.jpeg" alt="MSR Wears logo" width="120px" height="80px" /></a><p>Beautiful textiles. Thoughtful finds.<br>Pieces to make your own.</p></div>
        <div class="footer-column"><b>EXPLORE</b><a routerLink="/" fragment="collections">Home</a><a routerLink="/cart">Shopping cart</a></div>
        <div class="footer-column"><b>YOUR ACCOUNT</b><a routerLink="/login">Sign in</a><a routerLink="/register">Create account</a><a routerLink="/orders">Order history</a></div>
        <div class="footer-note"><span>MADE FOR THE MOMENTS THAT MATTER</span><h3>Find your<br><em>everyday beautiful.</em></h3></div>
      </div>
      <div class="footer-bottom"><span>© {{ year }} MSR Wears. All rights reserved.</span><span>CRAFT · COMFORT · CHARACTER</span></div>
    </footer>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  year = new Date().getFullYear();
  linkMatchOptions = { paths: 'exact' as const, queryParams: 'ignored' as const, matrixParams: 'ignored' as const, fragment: 'exact' as const };
  suggestions: SearchSuggestion[] = [];
  suggestionsOpen = false;
  suggestionsLoading = false;
  suggestionsError = false;
  accountMenuOpen = false;
  categories: Category[] = [];
  private readonly searchQueries = new Subject<string>();
  private readonly subscriptions = new Subscription();

  constructor(public auth: AuthService, public homeSearch: HomeSearchService, private store: StoreService, private router: Router) {}

  ngOnInit() {
    this.subscriptions.add(this.store.categories().subscribe({
      next: items => {
        this.categories = items.filter(category => category.isActive);
        const query = this.homeSearch.query().trim();
        if (query.length >= 3) this.searchQueries.next(query);
      },
      error: () => { this.categories = []; }
    }));
    this.subscriptions.add(this.searchQueries.pipe(
      map(query => query.trim()),
      debounceTime(180),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 3) return of({ query, products: [] as Product[], error: false });
        this.suggestionsLoading = true;
        return this.store.products(query, '', 5).pipe(
          map(result => ({ query, products: result.items, error: false })),
          catchError(() => of({ query, products: [] as Product[], error: true }))
        );
      })
    ).subscribe({
      next: result => {
        if (result.query !== this.homeSearch.query().trim()) return;
        if (result.error) {
          this.suggestions = [];
          this.suggestionsError = true;
          this.suggestionsLoading = false;
          return;
        }
        this.suggestionsError = false;
        const normalizedQuery = result.query.toLocaleLowerCase();
        const collectionSuggestions = this.categories
          .filter(category => category.name.toLocaleLowerCase().includes(normalizedQuery))
          .slice(0, 5)
          .map(category => HomeSearchService.collectionSuggestion(category));
        this.suggestions = [
          ...collectionSuggestions,
          ...result.products.map(product => HomeSearchService.productSuggestion(product))
        ];
        this.suggestionsLoading = false;
      },
      error: () => {
        this.suggestions = [];
        this.suggestionsError = true;
        this.suggestionsLoading = false;
      }
    }));
  }

  ngOnDestroy() { this.subscriptions.unsubscribe(); }

  onSearchChange(query: string) {
    this.homeSearch.setQuery(query);
    this.suggestions = [];
    this.suggestionsError = false;
    this.suggestionsOpen = query.trim().length >= 3;
    if (this.suggestionsOpen) {
      this.suggestionsLoading = true;
      this.searchQueries.next(query);
    } else {
      this.suggestions = [];
      this.suggestionsLoading = false;
      this.suggestionsError = false;
    }
  }

  closeSuggestions() { this.suggestionsOpen = false; }

  toggleAccountMenu() { this.accountMenuOpen = !this.accountMenuOpen; }
  closeAccountMenu() { this.accountMenuOpen = false; }

  selectSuggestion(suggestion: SearchSuggestion) {
    this.suggestionsOpen = false;
    const query = suggestion.kind === 'product' ? suggestion.label : '';
    this.homeSearch.setQuery(query);
    this.router.navigate(['/search'], {
      queryParams: {
        q: query || null,
        categoryId: suggestion.kind === 'collection' ? suggestion.id : null,
        categoryName: suggestion.kind === 'collection' ? suggestion.label : null
      }
    });
  }

  searchProducts() {
    const query = this.homeSearch.query().trim();
    this.suggestionsOpen = false;
    this.homeSearch.setQuery(query);
    this.router.navigate(['/search'], { queryParams: { q: query || null } });
  }

  logout() {
    this.closeAccountMenu();
    this.auth.logout().subscribe({ next: () => location.assign('/') });
  }
}
