import { Component, Input, OnInit, HostListener, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-table',
  standalone: true,
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class TableComponent implements OnInit, OnChanges {
  @Input() tableData!: TableData;
  @Output() paramChange = new EventEmitter<{ keywords: string, sortBy: string, sortDir: string, pageSize: number, pageNo: number, filters: { [key: string]: any }; }>(); // Emit sorting and pagination event

  private searchSubject = new Subject<string>();

  selectAll: boolean = false;
  sortBy: string = '';
  sortDesc: boolean = false;
  sortDir: string = '';
  pageSize: number = 10;
  isSearch: boolean = false;
  itemStart: number = 0;
  itemEnd: number = 0;
  totalItems: number = 0;
  pageCount: number = 0;
  dropdownOpen: boolean = false;
  selectedValue: number = 10; // Default selected value
  currPage: number = 1; // Start at page 1 by default
  lastPage: number = 1;
  keywords: string = "";
  selectedFilterCategory: TableFilters | null = null;
  isFilters: boolean = false
  filters: { [key: string]: any } = {};


  constructor() {}

  ngOnInit(): void {
    console.log('ngOnInit tableData', this.tableData);

    // Calculate total pages based on totalRecords and pageSize
    this.totalItems = this.tableData?.totalRecords || 0;
    this.lastPage = Math.ceil(this.totalItems / this.pageSize);

    this.searchSubject
      .pipe(
        debounceTime(200), // 200ms delay
        distinctUntilChanged() // Emit only if the query has changed
      )
      .subscribe(query => {
        this.keywords = query;
        this.paramChange.emit({
          keywords: this.keywords,
          sortBy: this.sortBy,
          sortDir: this.sortDir,
          pageSize: this.pageSize,
          pageNo: this.currPage,
          filters: this.filters,
        });
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges tableData', this.tableData, changes);

    // Recalculate total pages if totalRecords or pageSize changes
    if (changes['tableData'] && this.tableData) {
      this.totalItems = this.tableData.totalRecords || 0;
      this.lastPage = Math.ceil(this.totalItems / this.pageSize);
    }
  }

  // Getter to check if filters is not empty
  get hasFilters(): boolean {
    return Object.keys(this.filters).length > 0;
  }

  // Calculate the grid-template-columns for the table
  calcColumns(items: TableHeader[]): string {
    let columns = '';

    if (this.tableData.selectable) {
      columns += '0.1fr ';
    }

    columns += `repeat(${items.length - 1}, 1fr) `;

    if (items.some(item => item.name.toLowerCase() === 'actions')) {
      columns += '70px';
    }

    return columns;
  }

  // Toggle the dropdown menu visibility for a specific row
  toggleDropdown(row: TableRow) {
    this.tableData.body.forEach((r) => {
      if (r !== row) {
        r['showDropdown'] = false;
      }
    });
    row['showDropdown'] = !row['showDropdown'];
  }

  // Handle click outside of the dropdown menu to close it
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const targetElement = event.target as HTMLElement;

    this.tableData.body.forEach((row) => {
      if (
        row['showDropdown'] &&
        !targetElement.closest('.dropdown-menu') &&
        !targetElement.closest('.action-cell')
      ) {
        row['showDropdown'] = false;
      }
    });
  }

  // Handle sorting when a sortable header is clicked
  toggleSort(sortBy: string) {
    console.log('Order By: ', sortBy);

    this.sortBy = sortBy;
    this.sortDesc = !this.sortDesc;

    this.sortDir = this.sortDesc ? 'desc' : 'asc';

    // Emit the sorting change event
    this.paramChange.emit({
      keywords: this.keywords,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      pageSize: this.pageSize,
      pageNo: this.currPage,
      filters: this.filters,
    });
  }

  // Handle select all checkbox change
  onSelectAllChange() {
    this.tableData.body.forEach((row) => {
      row['selected'] = this.selectAll;
    });
    this.updateSelectedRows();
  }

  // Handle individual row selection change
  onRowSelectChange(row: TableRow) {
    this.updateSelectedRows();
    this.selectAll = this.tableData.body.every((row) => row['selected']);
  }

  // Update the selected rows array based on the current selection
  updateSelectedRows() {
    this.tableData.selectedRows = this.tableData.body.filter((row) => row['selected']);
  }

  toggleSearch() {
    this.isSearch = !this.isSearch;
  }

  // Method to emit the search query with a delay
  onSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const query = inputElement.value;
    this.searchSubject.next(query); // Emit the query to the subject
  }

  toggleSelect() {
    this.dropdownOpen = !this.dropdownOpen;
    console.log("toggleSelect",this.dropdownOpen)
  }

  selectItem(value: number) {
    this.pageSize = value;
    this.dropdownOpen = false;

    // Recalculate last page based on new pageSize
    this.lastPage = Math.ceil(this.totalItems / this.pageSize);

    this.paramChange.emit(
      {
        keywords: this.keywords,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
        pageSize: this.pageSize,
        pageNo: this.currPage,
        filters: this.filters,
       }
    );
  }

  // Handle clicks outside the dropdown
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const targetElement = event.target as HTMLElement;
    const dropdown = document.querySelector('.uc2ui-dropdown');

    if (dropdown && !dropdown.contains(targetElement)) {
      this.dropdownOpen = false;
    }
  }

  // Navigate to a specific page
  navigatePage(pageNo: number) {
    this.goToPage(pageNo);
  }

  // Define the visible page numbers
  get visiblePages(): number[] {
    const totalPages = this.lastPage;
    const currPage = this.currPage;
    const pagesToShow = 3;
    const pages = [];

    if (totalPages <= pagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currPage <= 2) {
        pages.push(1, 2, 3);
        if (totalPages > 3) {
          pages.push(-1, totalPages); // -1 indicates an ellipsis
        }
      } else if (currPage >= totalPages - 1) {
        pages.push(1, -1, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, -1, currPage - 1, currPage, currPage + 1, -1, totalPages);
      }
    }
    return pages;
  }

  getVisiblePages(): number[] {
    const totalPages = this.lastPage;
    const currPage = this.currPage;
    const maxPagesToShow = 5; // Total number of pages to show (including ellipses)
    const pages = [];

    if (totalPages <= maxPagesToShow) {
      // Less than or equal to maxPagesToShow pages, show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // More than maxPagesToShow pages
      const leftBound = Math.max(1, currPage - 2);
      const rightBound = Math.min(totalPages, currPage + 2);

      if (leftBound > 2) {
        pages.push(1);
        pages.push(-1);
      }

      for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
      }

      if (rightBound < totalPages - 1) {
        pages.push(-1);
        pages.push(totalPages);
      }
    }

    return pages;
  }

  goToPage(page: number): void {
    if (page === -1 || page === this.currPage) {
      return;
    }

    if (page < 1) {
      this.currPage = 1;
    } else if (page > this.lastPage) {
      this.currPage = this.lastPage;
    } else {
      this.currPage = page;
    }

    this.paramChange.emit({
      keywords: this.keywords,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      pageSize: this.pageSize,
      pageNo: this.currPage,
      filters: this.filters,
    });
  }

  toggleFilters(){
    this.isFilters = !this.isFilters
  }

  onCategorySelectChange(category: TableFilters): void {
    this.selectedFilterCategory = category.selected ? category : null;
    // Additional logic to handle category selection
  }

  onValueSelectChange(value: FilterValues): void {
    // Logic to handle value selection within the selected category
  }

  applyFilter() {
    this.filters = {}; // Reset filters

    this.tableData.filters?.forEach(category => {
      const selectedValues = category.values.filter(v => v.selected);

      if (selectedValues.length > 0) {
        this.filters[category.name] = selectedValues.map(v => v.name);
      }
    });

    console.log("applyfilters", this.filters);

    // Emit the parameters with the current filters applied
    this.paramChange.emit({
      keywords: this.keywords,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      pageSize: this.pageSize,
      pageNo: this.currPage,
      filters: this.filters,
    });
  }



  clearFilters() {
    if (this.tableData?.filters) {
      this.tableData.filters.forEach(category => {
        category.selected = false;
        if (category.values) {
          category.values.forEach(value => {
            value.selected = false;
          });
        }
      });
    }
  }

}

// Interfaces
export interface TableData {
  name: string;
  header: TableHeader[];
  body: TableRow[];
  selectable?: boolean;
  search?: boolean;
  pagination?: boolean;
  buttons?: TableButtons[];
  buttonsPosition?: string;
  selectedRows?: TableRow[];
  totalRecords?: number;
  filters?: TableFilters[];
}

export interface TableHeader {
  name: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface TableRow {
  [key: string]: any;
  actions?: TableAction[];
  selected?: boolean;
  showDropdown?: boolean;
}

export interface TableAction {
  name: string;
  icon?: string;
  position?: string;
  callback: (id: number) => void;
}

export interface TableParams {
  page?: number;
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
  keywords?: string;
  filters?: []
}

export interface TableButtons {
  label: string;
  icon?: string;
  position?: string;
  callback: () => void;
}

export interface TableRecords {
  content: any[];
  totalRecords: number;
}

export interface TableFilters {
  name: string;
  label: string;
  values: FilterValues[];
  selected?: boolean;  // Optional, to track selection
}

export interface FilterValues {
  name: string;
  label: string;
  value: string;
  selected?: boolean;  // Optional, to track selection
}
