export interface CatalogSearchProps {
  q: string
  /** Recebe o texto depois do debounce; deve trocar a URL com replace. */
  onSearch: (q: string) => void
}
