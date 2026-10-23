/**
 * Export expenses collection to CSV file with UTF-8 BOM encoding
 */

export function exportExpensesToCsv(expenses, filename = 'despesas.csv') {
  if (!expenses || !expenses.length) return false

  const headers = ['Descrição', 'Valor (R$)', 'Categoria', 'Forma de Pagamento', 'Data', 'Status', 'Recorrente', 'Notas']
  const rows = expenses.map((e) => [
    `"${(e.description || '').replace(/"/g, '""')}"`,
    Number(e.amount).toFixed(2),
    `"${(e.category || '').replace(/"/g, '""')}"`,
    `"${(e.paymentMethod || '').replace(/"/g, '""')}"`,
    e.date,
    e.status === 'paid' ? 'Pago' : 'Pendente',
    e.recurring ? 'Sim' : 'Não',
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ])

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}
