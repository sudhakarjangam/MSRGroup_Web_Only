import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../core/store.service';
import { Category } from '../core/models';

@Component({ standalone:true, imports:[FormsModule], template:`
<div class="container">
<div class="section-head"><div><h1>Categories</h1><p class="muted">Organize your product catalog.</p></div><button (click)="newCategory()">Add category</button></div>
@if(editing){<form class="panel editor" (ngSubmit)="save()"><h2>{{form.id?'Edit category':'New category'}}</h2>
<label>Name<input name="name" [(ngModel)]="form.name" required maxlength="120"></label><label>Description<textarea name="description" [(ngModel)]="form.description"></textarea></label>
<div class="actions"><button [disabled]="busy">Save category</button><button type="button" class="secondary" (click)="editing=false">Cancel</button></div>@if(error){<p class="error">{{error}}</p>}</form>}
<div class="panel table-wrap"><table><thead><tr><th>Name</th><th>Slug</th><th>Description</th><th>Actions</th></tr></thead><tbody>
@for(c of categories();track c.id){<tr><td>{{c.name}}</td><td>{{c.slug}}</td><td>{{c.description}}</td><td><button class="small secondary" (click)="edit(c)">Edit</button> <button class="small danger" (click)="remove(c)">Deactivate</button></td></tr>}
</tbody></table></div>
</div>
`})
export class AdminCategoriesComponent implements OnInit {
  categories=signal<Category[]>([]);editing=false;busy=false;error='';form:any=this.empty();
  constructor(private store:StoreService){}
  ngOnInit(){this.load();}
  empty(){return {id:'',name:'',description:'',isActive:true};}
  load(){this.store.categories().subscribe(x=>this.categories.set(x));}
  newCategory(){this.form=this.empty();this.editing=true;this.error='';}
  edit(c:Category){this.form={...c};this.editing=true;this.error='';}
  save(){this.busy=true;const call=this.form.id?this.store.updateCategory(this.form.id,this.form):this.store.createCategory(this.form);call.subscribe({next:()=>{this.busy=false;this.editing=false;this.load();},error:e=>{this.busy=false;this.error=e.error?.message??'Save failed.';}});}
  remove(c:Category){if(!confirm(`Deactivate ${c.name}?`))return;this.store.deleteCategory(c.id).subscribe({next:()=>this.load(),error:e=>this.error=e.error?.message??'Could not deactivate category.'});}
}
