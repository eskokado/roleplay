import BadRequest from 'App/Exceptions/BadRequestException'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Group from 'App/Models/Group'
import CreateGroupValidator from 'App/Validators/CreateGroupValidator'

export default class GroupsController {
  private all() {
    return Group.query().preload('players').preload('masterUser')
  }

  private filterByUser(userId: number) {
    return Group.query()
      .preload('players')
      .preload('masterUser')
      .withScopes((scope) => scope.withPlayers(userId))
  }

  private filterByText(text: string) {
    return Group.query()
      .preload('players')
      .preload('masterUser')
      .withScopes((scope) => scope.withText(text))
  }

  private filterByUserAndText(userId: number, text: string) {
    return Group.query()
      .preload('players')
      .preload('masterUser')
      .withScopes((scope) => scope.withPlayers(userId))
      .withScopes((scope) => scope.withText(text))
  }

  private filterByQueryString(userId: number, text: string) {
    if (userId && text) return this.filterByUserAndText(userId, text)
    else if (userId) return this.filterByUser(userId)
    else if (text) return this.filterByText(text)
    else return this.all()
  }

  public async index({ request, response }: HttpContextContract) {
    const { text, ['user']: userId } = request.qs()
    const groups = await this.filterByQueryString(userId, text)
    return response.ok({ groups })
  }

  public async store({ request, response }: HttpContextContract) {
    const groupPayload = await request.validate(CreateGroupValidator)
    const group = await Group.create(groupPayload)

    await group.related('players').attach([groupPayload.master])
    await group.load('players')

    return response.created({ group })
  }

  public async update({ request, response, bouncer }: HttpContextContract) {
    const id = request.param('id')
    const payload = request.all()
    const group = await Group.findOrFail(id)

    await bouncer.authorize('updateGroup', group)

    const updatedGroup = await group.merge(payload).save()

    return response.ok({ group: updatedGroup })
  }

  public async removePlayer({ request, response }: HttpContextContract) {
    const groupId = request.param('groupId') as number
    const playerId = +request.param('playerId')

    const group = await Group.findOrFail(groupId)
    if (group.master === playerId) throw new BadRequest('cannot remove master from group', 400)

    await group.related('players').detach([playerId])

    return response.ok({
      group,
    })
  }

  public async destroy({ request, response, bouncer }: HttpContextContract) {
    const id = request.param('id')
    const group = await Group.findOrFail(id)

    await bouncer.authorize('deleteGroup', group)

    await group.delete()

    // await group.related('players').detach() // or add migration CASCADE

    return response.ok({})
  }
}
