import { useId } from 'react'

import { CATALOG_SORTS, type CatalogSort } from '@/shared/contracts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import type { SortSelectProps } from './types'

const LABELS: Record<CatalogSort, string> = {
  recent: 'Listados recentemente',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
}

export function SortSelect(props: SortSelectProps) {
  const labelId = useId()
  return (
    <div className="flex items-center gap-1 text-sm lg:text-15">
      <span id={labelId}>Ordenar por:</span>
      <Select value={props.value} onValueChange={(value) => props.onChange(value as CatalogSort)}>
        <SelectTrigger
          aria-labelledby={labelId}
          className="h-auto border-none bg-transparent px-1 py-1 shadow-none lg:text-15 dark:bg-transparent"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATALOG_SORTS.map((sort) => (
            <SelectItem key={sort} value={sort}>
              {LABELS[sort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
