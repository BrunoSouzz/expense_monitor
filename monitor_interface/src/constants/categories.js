export const CATEGORIES_LIST = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Contas',
  'Outros',
]

export const PAYMENT_METHODS = [
  'Pix',
  'Cartão de débito',
  'Cartão de crédito',
  'Dinheiro',
  'Boleto bancário',
  'Transferência',
  'Outro',
]

export const RECURRING_FREQUENCIES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
]

export const CHART_COLORS = [
  'var(--accent)',
  'var(--support)',
  'var(--success)',
  'var(--accent-dark)',
]

export const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Mais recentes primeiro' },
  { value: 'date_asc', label: 'Mais antigas primeiro' },
  { value: 'amount_desc', label: 'Maior valor primeiro' },
  { value: 'amount_asc', label: 'Menor valor primeiro' },
]

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'paid', label: 'Apenas Pagas' },
  { value: 'pending', label: 'Apenas A Pagar' },
]
