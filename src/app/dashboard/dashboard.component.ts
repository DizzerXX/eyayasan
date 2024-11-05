import {
  Component,
  OnInit,
  QueryList,
  ViewChildren,
  Directive,
  Input,
  Output,
  EventEmitter,
  PipeTransform
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { SidebarComponent } from "../core/sidebar/sidebar.component";

interface Country {
  name: string;
  area: number;
  population: number;
  flag: string;
}

@Directive({
  selector: '[sortable]',
  host: {
    '(click)': 'onClick()'
  }
})
export class SortableHeader {
  @Input() sortable: string = '';
  @Input() direction: 'asc' | 'desc' = 'asc';
  @Output() sortChange = new EventEmitter<{ column: string; direction: string }>();

  onClick() {
    this.direction = this.direction === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ column: this.sortable, direction: this.direction });
  }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPaginationModule,
    DecimalPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  countries: Country[] = [
    { name: 'France', area: 551695, population: 67022000, flag: 'c/c3/Flag_of_France.svg' },
    { name: 'Germany', area: 357386, population: 83122889, flag: 'b/ba/Flag_of_Germany.svg' },
    { name: 'Italy', area: 301340, population: 59554023, flag: '0/03/Flag_of_Italy.svg' },
    // Add more countries as needed
  ];

  filter = new FormControl('');
  page = 1;
  pageSize = 4;
  collectionSize = this.countries.length;
  sortDirection: 'asc' | 'desc' = 'asc'; // Add this property

  private _filteredCountries$ = new BehaviorSubject<Country[]>(this.countries);
  filteredCountries$: Observable<Country[]> = this._filteredCountries$.asObservable();
  paginatedCountries$: Observable<Country[]> = this.filteredCountries$.pipe(
    map(countries => this.paginate(countries))
  );

  ngOnInit(): void {
    this.filter.valueChanges
      .pipe(startWith(''))
      .subscribe(() => this.refreshCountries());
  }

  onSort(column: string) {
    const direction = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortDirection = direction; // Toggle the direction
    this.countries = this.sortCountries(this.countries, column, direction);
    this.refreshCountries();
  }

  private paginate(countries: Country[]): Country[] {
    const start = (this.page - 1) * this.pageSize;
    return countries.slice(start, start + this.pageSize);
  }

  private sortCountries(countries: Country[], column: string, direction: string): Country[] {
    if (direction === '' || column === '') return countries;
    return [...countries].sort((a, b) => {
      const res = a[column as keyof Country] < b[column as keyof Country] ? -1 : 1;
      return direction === 'asc' ? res : -res;
    });
  }

  private filterCountries(text: string, countries: Country[]): Country[] {
    return countries.filter(country =>
      country.name.toLowerCase().includes(text.toLowerCase()) ||
      country.area.toString().includes(text) ||
      country.population.toString().includes(text)
    );
  }

  refreshCountries() {
    const filtered = this.filterCountries(this.filter.value || '', this.countries);
    this.collectionSize = filtered.length;
    this._filteredCountries$.next(filtered);
  }
}
