import type { CatalogSort } from '@/shared/contracts'

export interface SortSelectProps {
  value: CatalogSort
  onChange: (sort: CatalogSort) => void
}
