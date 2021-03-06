const Command = require('../../struct/custom/Command');
const { get } = require('snekfetch');

const { emojis, url } = require('../../auth');

class LeaderboardKamihimeCommand extends Command {
  constructor() {
    super('leaderboard', {
      aliases: ['leaderboard', 'lb', 'toppeeks', 'top'],
      description: {
        content: 'Displays leaderboard of kamihime for top views on harem scenes.',
        usage: '<page number>',
        examples: ['', '13', '37']
      },
      paginated: true,
      args: [
        {
          id: 'page',
          type: 'integer',
          default: 1
        },
        {
          id: 'advanced',
          match: 'flag',
          flag: ['--dev', '--advanced']
        }
      ]
    });
    this.apiURL = url.api;
    this.loading = emojis.loading;
  }

  async exec(message, { page, advanced }) {
    try {
      await message.util.send(`${this.loading} Awaiting Kamihime DB's response...`);

      const data = await get(`${this.apiURL}list`);
      let list = this.combine(data.body);
      list = list.filter(c => c.peekedOn !== 0);
      list = list.sort((a, b) => b.peekedOn - a.peekedOn);

      const embed = this.util.paginationFields()
        .setAuthorizedUsers([message.author.id])
        .setChannel(message.channel)
        .setClientMessage(message.util.lastResponse, `${this.loading} Preparing...`)
        .setArray(list)
        .setPage(page)
        .setTitle('Most Views Leaderboard (Harem Scenes)')
        .setColor(0xFF00AE)
        .setTimeout(240 * 1000)
        .addField('Help', 'React with the emoji below to navigate. ↗ to skip a page.');

      if (advanced) embed.formatField('#) ID', i => `${list.indexOf(i) + 1}) ${i.khID}`);
      embed
        .formatField(
          advanced
            ? 'Name'
            : '#) Name',
          i => `${advanced
            ? ''
            : `${list.indexOf(i) + 1}) `}${i.khName}`
        )
        .formatField('Views', i => i.peekedOn);

      return await embed.build();
    } catch (err) {
      return new this.client.APIError(message.util, err, 1);
    }
  }

  combine(result) {
    const array = [];
    for (const k in result)
      for (let v = 0; v < result[k].length; v++)
        array.push(result[k][v]);

    return array;
  }
}

module.exports = LeaderboardKamihimeCommand;
