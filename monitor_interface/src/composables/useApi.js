// Mesma origem por padrão (a API serve o front no app desktop; no dev o Vite faz proxy).
// VITE_API_BASE permite apontar um build para uma API em outro endereço.
const base = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export async function api(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('Não foi possível falar com o servidor. Verifique se a API está em execução.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'Não foi possível concluir a operação.')
  }
  return response.status === 204 ? null : response.json()
}
