export const CATEGORIES_LIST = [
  'Alimentação',
  'Supermercado',
  'Moradia & Aluguel',
  'Contas de Consumo (Luz/Água/Gás)',
  'Internet & Telefone',
  'Transporte & Combustível',
  'Saúde & Farmácia',
  'Educação & Cursos',
  'Lazer & Entretenimento',
  'Assinaturas & Streaming',
  'Cartão de Crédito',
  'Compras Pessoais',
  'Vestuário & Calçados',
  'Pets & Veterinário',
  'Serviços & Diarista',
  'Investimentos & Reserva',
  'Empréstimos & Dívidas',
  'Impostos & Tributos',
  'Viagens & Hospedagem',
  'Doações & Presentes',
  'Manutenção & Reformas',
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
  { value: 'monthly', label: 'Mensal (Cobrança todo mês)' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'yearly', label: 'Anual' },
]

export const CHART_COLORS = [
  'var(--accent)',
  'var(--support)',
  'var(--success)',
  'var(--accent-dark)',
  '#f87171',
  '#60a5fa',
  '#fbbf24',
  '#34d399',
]

export const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Mais recentes primeiro' },
  { value: 'date_asc', label: 'Mais antigas primeiro' },
  { value: 'amount_desc', label: 'Maior valor primeiro' },
  { value: 'amount_asc', label: 'Menor valor primeiro' },
]

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pending', label: 'Apenas A Pagar' },
  { value: 'paid', label: 'Apenas Pagas' },
  { value: 'overdue', label: '⚠️ Apenas Atrasadas' },
]
