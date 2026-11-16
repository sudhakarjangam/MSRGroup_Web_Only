import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Category, Product } from './models';

export type SearchSuggestion =
  | { kind: 'product'; id: string; label: string; detail: string }
  | { kind: 'collection'; id: string; label: string; detail: string };

@Injectable({ providedIn: 'root' })
export class HomeSearchService {
  readonly query = signal('');
  readonly pendingSuggestion = signal<SearchSuggestion | null>(null);
  private readonly queryChanges = new Subject<string>();
  readonly changes = this.queryChanges.asObservable();
  private readonly suggestionSelections = new Subject<SearchSuggestion>();
  readonly selections = this.suggestionSelections.asObservable();

  setQuery(query: string) {
    if (query === this.query()) return;
    this.query.set(query);
    this.queryChanges.next(query);
  }

  selectSuggestion(suggestion: SearchSuggestion) {
    this.pendingSuggestion.set(suggestion);
    this.suggestionSelections.next(suggestion);
  }

  consumePendingSuggestion() {
    const suggestion = this.pendingSuggestion();
    this.pendingSuggestion.set(null);
    return suggestion;
  }

  static productSuggestion(product: Product): SearchSuggestion {
    return { kind: 'product', id: product.id, label: product.name, detail: product.categoryName };
  }

  static collectionSuggestion(category: Category): SearchSuggestion {
    return { kind: 'collection', id: category.id, label: category.name, detail: 'Collection' };
  }
}
