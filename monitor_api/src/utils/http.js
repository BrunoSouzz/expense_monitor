import { config } from '../config/env.js'

export const resolveAllowedOrigin = (requestOrigin) => {
  if (config.corsOrigin === '*') return '*'
  if (!requestOrigin) return config.corsOrigin
  const allowedList = config.corsOrigin.split(',').map((item) => item.trim())
  if (allowedList.includes(requestOrigin) || allowedList.includes('*')) return requestOrigin
  return allowedList[0] || '*'
}

export const send = (response, statusCode, body = null) => {
  const requestOrigin = response.req?.headers?.origin
  const allowedOrigin = resolveAllowedOrigin(requestOrigin)

  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8',
  })

  if (body !== null) {
    response.end(JSON.stringify(body))
  } else {
    response.end()
  }
}

export const readBody = async (request) => {
  let raw = ''
  for await (const chunk of request) raw += chunk
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
