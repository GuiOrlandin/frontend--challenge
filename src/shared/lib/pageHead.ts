/** `head` de rota (SPEC §15): título e descrição próprios, renderizados pelo `HeadContent` da raiz. */
export const pageHead = (title: string, description: string) => ({
  meta: [{ title: `${title} | Kurio` }, { name: 'description', content: description }],
})
