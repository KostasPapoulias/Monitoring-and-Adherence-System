import { Component, OnInit } from '@angular/core';
import { ItemModel } from 'src/app/global/models/items/item.model';
import { ItemsService } from 'src/app/global/services/item-shop/item-shop.service';


@Component({
  selector: 'item-shop',
  templateUrl: './item-shop.component.html',
  styleUrls: ['./item-shop.component.scss']
})
export class ItemShopComponent implements OnInit {
  protected imagePath: string = "/assets/";
  protected items: ItemModel[] = [];
  protected selectedItem: ItemModel = new ItemModel({
    name: "",
    description: "",
    image: "",
    price: -1,
    rating: -1,
    isAvailable: false,
    selected: false
  });

  constructor(private itemsService: ItemsService) { }

  async ngOnInit() {
    this.itemsService.getAll().subscribe({
      next: (result) => {
        this.items = result;
        if (this.items.length > 0) {
          this.selectedItem = this.items[0];
        }
      },
      error: () => {
        // Fallback demo items from assets if backend is unavailable
        this.items = [
          new ItemModel({ name: 'Milk', description: '1L fresh milk', image: 'item-shop/milk.jpg', price: 1.5, rating: 4, isAvailable: true }),
          new ItemModel({ name: 'Honey', description: 'Organic honey', image: 'item-shop/honey.jpg', price: 5.0, rating: 5, isAvailable: true }),
          new ItemModel({ name: 'Cereal bar', description: 'Healthy snack', image: 'item-shop/cereal bar.jpg', price: 0.9, rating: 4, isAvailable: true }),
        ];
        this.selectedItem = this.items[0];
      }
    });

  }

  public onItemClick(item: ItemModel) {
    this.items.forEach(item => { item.selected = false });
    this.selectedItem = item;
    item.selected = true;
  }
}
