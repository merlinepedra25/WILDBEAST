import { Interaction } from 'detritus-client'
import { MessageFlags } from 'detritus-client/lib/constants'
import driver from '../../../database/driver'
import { Tag } from '../../../database/models/Tag'
import { translate } from '../../../utils/i18n'
import { error } from '../../../utils/logger'
import { BaseCommandOption } from '../../base'

export interface CommandArgs {
  name: string
}

export class DeleteTagCommand extends BaseCommandOption {
  name = 'delete'
  translationPath = 'tag'
  description = this.translateThis('metadata.descriptions.delete')
  disableDm = true

  constructor () {
    super({
      options: [
        {
          name: 'name',
          description: translate('slash-commands.tag.metadata.options.name'),
          required: true,
          async onAutoComplete (context: Interaction.InteractionAutoCompleteContext): Promise<void> {
            const search = `${context.value}%`
            const hits = await driver`SELECT name FROM tags WHERE owner = ${context.userId} AND guild = ${context.guildId!} AND name LIKE ${search} ORDER BY name LIMIT 10` as Tag[]
            const choices = hits.map((value) => ({ name: value.name, value: value.name }))
            await context.respond({ choices })
          }
        }
      ]
    })
  }

  async onBeforeRun (context: Interaction.InteractionContext, args: CommandArgs): Promise<boolean> {
    const tag = await driver`SELECT name FROM tags WHERE name = ${args.name} AND owner = ${context.userId} AND guild = ${context.guildId!}` as Tag[]
    if (tag.length === 0) {
      await context.editOrRespond({
        content: this.translateThis('errors.notFound'),
        flags: MessageFlags.EPHEMERAL
      })
      return false
    } return true
  }

  async run (context: Interaction.InteractionContext, args: CommandArgs): Promise<void> {
    try {
      await driver`DELETE FROM tags WHERE name = ${args.name} AND owner = ${context.userId} AND guild = ${context.guildId!}`
      await context.editOrRespond({
        content: this.translateThis('deleted'),
        flags: MessageFlags.EPHEMERAL
      })
    } catch (e) {
      error(e, this.constructor.name)
      await context.editOrRespond({
        content: translate('common.softFail'),
        flags: MessageFlags.EPHEMERAL
      })
    }
  }
}
