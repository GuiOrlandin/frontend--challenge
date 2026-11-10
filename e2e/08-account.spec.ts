import { expect, test } from './fixtures'

const PASSWORD = 'Kurio@123'

/** PNG 1×1 transparente. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

test.beforeEach(async ({ page, loginAs }) => {
  await loginAs('ana')
  await page.goto('/perfil')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
})

test('edita o perfil, persiste após o refresh e atualiza o header', async ({ page, isMobile }) => {
  await page.getByLabel('Nome de exibição').fill('Ana R.')
  await page.getByLabel('Nome ENS').fill('ana-r')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Perfil salvo')).toBeVisible()
  if (!isMobile) await expect(page.getByRole('button', { name: 'Conta de Ana R.' })).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana R.')
  await expect(page.getByLabel('Nome ENS')).toHaveValue('ana-r')
})

test('erros de validação e de conflito ficam no campo', async ({ page }) => {
  await page.getByLabel('Nome de exibição').fill('')
  await page.getByRole('button', { name: 'Salvar' }).click()
  const displayName = page.getByLabel('Nome de exibição')
  await expect(displayName).toHaveAccessibleDescription('Campo obrigatório')
  await expect(displayName).toBeFocused()

  await displayName.fill('Ana Ribeiro')
  await page.getByLabel('Nome de usuário').fill('bruno')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByLabel('Nome de usuário')).toHaveAccessibleDescription(
    'Este nome de usuário já está em uso',
  )
})

test('envia e remove o avatar, com persistência', async ({ page }) => {
  await page.getByLabel('Arquivo do avatar').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: PNG,
  })
  await expect(page.getByText('Avatar atualizado')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()

  await page.getByRole('button', { name: 'Remover' }).click()
  await expect(page.getByRole('img', { name: 'Sem avatar' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'Sem avatar' })).toBeVisible()
})

test('avatar de tipo inválido mostra erro sem enviar', async ({ page }) => {
  await page.getByLabel('Arquivo do avatar').setInputFiles({
    name: 'nota.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('oi'),
  })
  await expect(page.getByRole('alert')).toHaveText('Use PNG, JPEG ou WebP')
})

test('troca a senha: senha atual errada aponta o campo, a certa vale no próximo login', async ({
  page,
}) => {
  const current = page.getByLabel('Senha atual')
  await current.fill('errada123')
  await page.getByLabel('Nova senha', { exact: true }).fill('novaSenha123')
  await page.getByLabel('Confirmar nova senha').fill('novaSenha123')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(current).toHaveAccessibleDescription('Senha atual incorreta')

  await current.fill(PASSWORD)
  await page.getByLabel('Nova senha', { exact: true }).fill('novaSenha123')
  await page.getByLabel('Confirmar nova senha').fill('novaSenha123')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Perfil e senha salvos')).toBeVisible()
  await expect(current).toHaveValue('')

  const status = await page.evaluate(async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ana@kurio.dev', password: 'novaSenha123' }),
    })
    return res.status
  })
  expect(status).toBe(200)
})

test('senha trocada com conflito no perfil esvazia os campos de senha e avisa', async ({
  page,
}) => {
  await page.getByLabel('Nome de usuário').fill('bruno')
  await page.getByLabel('Senha atual').fill(PASSWORD)
  await page.getByLabel('Nova senha', { exact: true }).fill('novaSenha123')
  await page.getByLabel('Confirmar nova senha').fill('novaSenha123')
  await page.getByRole('button', { name: 'Salvar' }).click()

  await expect(page.getByLabel('Nome de usuário')).toHaveAccessibleDescription(
    'Este nome de usuário já está em uso',
  )
  await expect(
    page.getByText('A senha foi alterada; os dados do perfil não foram salvos.'),
  ).toBeVisible()
  await expect(page.getByLabel('Senha atual')).toHaveValue('')
})
