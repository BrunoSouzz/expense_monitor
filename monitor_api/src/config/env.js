import path from 'node:path'

export const config = {
  port: Number(process.env.PORT || 8000),
  dataDirectory: process.env.EXPENSE_MONITOR_DATA_DIR || path.join(process.cwd(), 'data'),
  get dataFile() {
    return path.join(this.dataDirectory, 'expense-monitor.json')
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
}
