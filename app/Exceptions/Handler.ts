import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'
import { Exception } from '@adonisjs/core/build/standalone'

/*
|--------------------------------------------------------------------------
| Http Exception Handler
|--------------------------------------------------------------------------
|
| AdonisJs will forward all exceptions occurred during an HTTP request to
| the following class. You can learn more about exception handling by
| reading docs.
|
| The exception handler extends a base `HttpExceptionHandler` which is not
| mandatory, however it can do lot of heavy lifting to handle the errors
| properly.
|
*/

export default class ExceptionHandler extends HttpExceptionHandler {
  constructor() {
    super(Logger)
  }

  public async handle(error: Exception, ctx: HttpContextContract) {
    console.log({ error: JSON.stringify(error) })
    if (error.status === 422)
      return await ctx.response.status(error.status).send({
        code: 'BAD_REQUEST',
        status: error.status,
        message: error.message,
        errors: error['messages']?.errors ? error['messages'].errors : '',
      })
    else if (error.code === 'E_ROW_NOT_FOUND')
      return await ctx.response.status(error.status).send({
        code: 'BAD_REQUEST',
        status: 404,
        message: 'resource not found',
      })
    return super.handle(error, ctx)
  }
}
