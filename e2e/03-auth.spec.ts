import { expect, SESSION_KEY, test, USERS } from './fixtures'

const PASSWORD = 'Kurio@123'

/** Header só existe de `md` para cima; no mobile o "Sair" vem com o `ProfileNav` (task 37). */
const headerOnly = (isMobile: boolean) =>
  test.skip(isMobile, 'Menu da conta fica no header, que não aparece no mobile')

test('login pela UI mostra erro de credencial e depois entra', async ({ page, isMobile }) => {
  await page.goto('/?auth=entrar')
  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await dialog.getByLabel('E-mail').fill(USERS.ana)
  await dialog.getByLabel('Senha', { exact: true }).fill('errada123')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog.getByText('E-mail ou senha incorretos.')).toBeVisible()

  await dialog.getByLabel('Senha', { exact: true }).fill(PASSWORD)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/$/)
  if (!isMobile) {
    await expect(page.getByRole('button', { name: 'Conta de Ana Ribeiro' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeHidden()
  }
})

test('cadastro com e-mail em uso aponta o campo e depois cria a conta', async ({
  page,
  isMobile,
}) => {
  await page.goto('/?auth=cadastro')
  const dialog = page.getByRole('dialog', { name: 'Criar conta' })
  await dialog.getByLabel('Nome de usuário').fill('nova_colecionadora')
  await dialog.getByLabel('E-mail').fill(USERS.ana)
  await dialog.getByLabel('Senha', { exact: true }).fill('senha1234')
  await dialog.getByLabel('Confirmar senha').fill('senha1234')
  await dialog.getByRole('button', { name: 'Criar conta' }).click()

  const email = dialog.getByLabel('E-mail')
  await expect(email).toHaveAccessibleDescription('Este e-mail já está em uso')
  await expect(email).toBeFocused()

  await email.fill('nova@kurio.dev')
  await dialog.getByRole('button', { name: 'Criar conta' }).click()
  await expect(dialog).toBeHidden()
  if (!isMobile) {
    await expect(page.getByRole('button', { name: 'Conta de nova_colecionadora' })).toBeVisible()
  }
})

test('session-expired ao navegar para uma página privada pede login e volta para ela', async ({
  page,
  loginAs,
  isMobile,
}) => {
  await page.goto('/?scenario=session-expired')
  await loginAs('ana')

  if (isMobile) {
    await page.getByRole('link', { name: 'Perfil' }).click()
  } else {
    await page.getByRole('button', { name: 'Conta de Ana Ribeiro' }).click()
    await page.getByRole('menuitem', { name: 'Dados do perfil' }).click()
  }

  await expect(page.getByText('Sua sessão expirou, entre novamente')).toBeVisible()
  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL(/\/\?.*redirect=%2Fperfil/)
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)).toBeNull()

  await dialog.getByLabel('E-mail').fill(USERS.ana)
  await dialog.getByLabel('Senha', { exact: true }).fill(PASSWORD)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/perfil$/)
  await expect(page.getByRole('heading', { name: 'Perfil', exact: true })).toBeVisible()
})

test('logout volta para o início como Visitante', async ({ page, loginAs, isMobile }) => {
  headerOnly(isMobile)
  await loginAs('ana')
  await page.getByRole('button', { name: 'Conta de Ana Ribeiro' }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()

  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)).toBeNull()
})

test('troca de usuário sai e entra com outra conta', async ({ page, loginAs, isMobile }) => {
  headerOnly(isMobile)
  await loginAs('ana')
  await page.getByRole('button', { name: 'Conta de Ana Ribeiro' }).click()
  await page.getByRole('menuitem', { name: 'Trocar de usuário' }).click()

  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await dialog.getByLabel('E-mail').fill(USERS.bruno)
  await dialog.getByLabel('Senha', { exact: true }).fill(PASSWORD)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Conta de Bruno Tavares' })).toBeVisible()
})
