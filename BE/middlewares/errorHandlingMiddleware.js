/* eslint-disable no-unused-vars */
import { StatusCodes } from 'http-status-codes'
import logger from '../logger/winston.log.js'

export const errorHandlingMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
  const message = err.message || StatusCodes[statusCode]

  // Log the error
  logger.error(`Error: ${statusCode} - ${message}`, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  })

  const responseError = {
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }

  res.status(statusCode).json(responseError)
}