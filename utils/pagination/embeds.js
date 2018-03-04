const { MessageEmbed } = require('discord.js');

class PaginationEmbeds {
  /**
   * Options for PaginationEmbeds.clientMessage.
   * @typedef {Object} ClientMessageOptions
   * @property {Message} [message=null] - The message object sent by the client, if there is any.
   * @property {string} [content='Preparing...'] - The custom message content while preparing the embed.
   */

  /**
   * Options for PaginationEmbeds.emojis.
   * @typedef {Object} NavigationButtons
   * @property {string} [back='◀'] - The back button.
   * @property {string} [jump='↗'] - The jump button.
   * @property {string} [forward='▶'] - The forward button.
   * @property {string} [delete='🗑'] - The delete button.
   */

  /**
   * Options for the constructor.
   * @typedef {Object} PaginationEmbedsOptions
   * @property {User} [authorisedUser=null] - The authorised user to navigate the pages.
   * @property {TextChannel} channel - The channel where to send the embed.
   * @property {ClientMessageOptions} [clientMessage=null] - Settings for the message sent by the client.
   * @property {MessageEmbed[]} array - An array of embeds to paginate.
   * @property {boolean} [pageIndicator=true] - Whether page number indicator on client's message content is shown or not.
   * @property {nmber|string} [page=1] - Jumps to a certain page upon PaginationEmbeds.build().
   * @property {number} [timeout=30000] - The time for awaiting a user action before timeout in ms.
   * @property {NavigationButtons} [emojis={back:'◀',jump:'↗',forward:'▶',delete:'🗑'}] - The emojis used for navigation buttons.
   */

  /**
   * @param {PaginationEmbedsOptions} [options={}] Options for pagination utility.
   */
  constructor(options = {}) {
    if (!(options instanceof Object)) throw new Error('Cannot invoke PaginationEmbeds class without an actual options object.');

    /**
     * The authorised user to navigate the pages.
     * @type {User}
     */
    this.authorisedUser = options.authorisedUser || null;

    /**
     * The channel where to send the embed.
     * @type {TextChannel}
     */
    this.channel = options.channel || null;

    /**
     * Settings for the message sent by the client.
     * @type {ClientMessageOptions}
     */
    this.clientMessage = options.clientMessage || { message: null, content: null };

    /**
     * An array of embeds to paginate.
     * @type {MessageEmbed[]}
     */
    this.array = options.array || [];

    /**
     * Whether page number indicator on client's message content is shown or not.
     * @type {boolean}
     */
    this.pageIndicator = options.pageIndicator || true;

    /**
     * Jumps to a certain page upon PaginationEmbeds.build().
     * @type {Number|String}
     */
    this.page = options.page || 1;

    /**
     * The time for awaiting a user action before timeout in ms.
     * @type {number}
     */
    this.timeout = options.timeout || 30000;

    /**
     * The emojis used for navigation buttons.
     * @type {NavigationButtons}
     */
    this.emojis = options.emojis || {
      back: '◀',
      jump: '↗',
      forward: '▶',
      delete: '🗑'
    };

    /**
     * Number of pages for this instance.
     * @type {number}
     * @private
     * @protected
     */
    this.pages = null;
  }

  /**
   * Embed in the current page.
   * @returns {MessageEmbed} - An instance of MessageEmbed.
   */
  get currentEmbed() {
    return this.array[this.page - 1];
  }

  /**
   * Build the Pagination Embeds.
   *
   * @example
   *
   * // Object as constructor.
   * const PaginationEmbeds = require('<utils>/pagination/embeds');
   * const { MessageEmbed } = require('discord.js');
   *
   * // Under message event.
   * new PaginationEmbeds({
   *  authorisedUser: message.author,
   *  channel: message.channel,
   *  clientMessage: { content: 'Preparing the embed...' },
   *  array: [
   *    new MessageEmbed({ title: 'John Doe' }),
   *    new MessageEmbed({ title: 'Jane Doe' })
   *  ],
   *  pageIndicator: false,
   *  page: 2,
   *  timeout: 69000,
   *  emojis: {
   *    back: '◀',
   *    jump: '↗',
   *    forward: '▶',
   *    delete: '🗑'
   *  }
   * }).build();
   *
   * @example
   *
   * // Methods as constructor.
   * const PaginationEmbeds = require('<utils>/pagination/embeds');
   * const { MessageEmbed } = require('discord.js');
   *
   * // Under message event.
   * new PaginationEmbeds()
   *  .setAuthorisedUser(message.author)
   *  .setChannel(message.channel)
   *  .setClientMessage(null, 'Preparing the embed...')
   *  .setArray([
   *    new MessageEmbed({ title: 'John Doe' }),
   *    new MessageEmbed({ title: 'Jane Doe' })
   *  ])
   *  .setPageIndicator(false)
   *  .setPage(2)
   *  .setTimeout(69000)
   *  .setEmojis({
   *    back: '◀',
   *    jump: '↗',
   *    forward: '▶',
   *    delete: '🗑'
   *  })
   *  .build();
   */
  async build() {
    this
      .setChannel(this.channel)
      .setAuthorisedUser(this.authorisedUser)
      .setClientMessage(this.clientMessage.message, this.clientMessage.content)
      .setArray(this.array)
      .showPageIndicator(this.pageIndicator)
      .setTimeout(this.timeout)
      .setEmojis(this.emojis);

    this.pages = this.array.length;
    this.setPage(this.page);

    if (!(this.page >= 1 && this.page <= this.pages)) throw new Error('Invalid page.');

    const message = this.clientMessage.message
      ? await this.clientMessage.message.edit(this.clientMessage.content)
      : await this.channel.send(this.clientMessage.content);
    this.setClientMessage(message, this.clientMessage.content);

    const permissions = ['ADD_REACTIONS', 'MANAGE_REACTIONS', 'MANAGE_MESSAGES', 'EMBED_LINKS'];
    const missing = message.channel.permissionsFor(message.client.user).missing(permissions);

    if (missing.length)
      throw new Error(`Cannot invoke PaginationEmbeds class without required permissions: ${missing.join(', ')}`);

    await this._loadList();
  }

  /**
   * Sets the array of elements to paginate.
   * @param {Array} array - An array of elements to paginate.
   * @returns {PaginationEmbeds} - Instance of PaginationEmbeds
   */
  setArray(array) {
    const isValidArray = Array.isArray(array) && Boolean(array.length);

    if (!isValidArray) throw new Error('Cannot invoke PaginationEmbeds class without initialising the array to paginate.');

    for (let i = 0; i < array.length; i++)
      if (array[i] instanceof MessageEmbed) continue;
      else throw new Error(`(MessageEmbeds[${i}]) Cannot invoke PaginationEmbeds class with an invalid MessageEmbed instance.`);

    this.array = array;

    return this;
  }

  /**
   * Set the authorised person to navigate the pages.
   * @param {User} [user=null] - The user object.
   * @returns {PaginationEmbeds} - Instance of PaginationEmbeds
   */
  setAuthorisedUser(user = null) {
    this.authorisedUser = user;

    return this;
  }

  /**
   * The channel where to send the embed.
   * @param {TextChannel} channel - The channel object.
   * @returns {PaginationEmbeds} - Instance of PaginationEmbeds
   */
  setChannel(channel) {
    this.channel = channel;

    return this;
  }

  /**
   * Sets the settings for the message sent by the client.
   * @param {Message} [message=null] - The message object sent by the client, if there is any.
   * @param {string} [content='Preparing...'] - The custom message content while preparing the embed.
   * @returns {PaginationEmbeds} - Instance of PaginationEmbeds
   */
  setClientMessage(message = null, content = null) {
    if (!content) content = 'Preparing...';

    Object.assign(this.clientMessage, { message, content });

    return this;
  }

  /**
   * Sets the emojis used for navigation buttons.
   * @param {NavigationButtons} [emojis={}] - An object containing customised emojis to use as navigation buttons.
   * @returns {PaginationEmbeds} - Instance of PaginationEmbeds
   */
  setEmojis(emojis) {
    Object.assign(this.emojis, emojis);

    return this;
  }

  /**
   * Sets to jump to a certain page upon calling PaginationEmbeds.build().
   * @param {number|string} [param=1] - The page number to jump to. As String: 'back', 'forward'
   * @returns {PaginationEmbeds} - Instance of PaginationEmbeds
   */
  setPage(param = 1) {
    const isString = typeof param === 'string';

    if (!(!isNaN(param) || isString)) throw new Error('setPage() only accepts number/string type.');

    const navigator = {
      back: this.page === 1 ? this.page : this.page - 1,
      forward: this.page === this.pages ? this.pages : this.page + 1
    }[param];

    this.page = isString ? navigator : param;

    return this;
  }

  /**
   * Sets the time for awaiting a user action before timeout in ms.
   * @param {number} [timeout=30000] Timeout value in ms.
   * @returns {PaginationEmbeds} - Instance of PaginationEmbeds
   */
  setTimeout(timeout = 30000) {
    if (typeof timeout !== 'number') throw new Error('setTimeout() only accepts number type.');

    this.timeout = timeout;

    return this;
  }

  /**
   * Sets whether page number indicator on client's message content is shown or not.
   * @param {boolean} [boolean=true] - Show page indicator?
   * @returns {PaginationEmbeds} - Instance of PaginationEmbeds
   */
  showPageIndicator(boolean = true) {
    if (typeof boolean !== 'boolean') throw new Error('showPageIndicator() only accepts boolean type.');

    this.pageIndicator = boolean === true;

    return this;
  }

  /**
   * Deploys emoji reacts for the MessageEmbed.
   * @private
   * @protected
   */
  async _drawNavigation() {
    if (this.page !== 1) await this.clientMessage.message.react(this.emojis.back);
    if (this.pages > 2) await this.clientMessage.message.react(this.emojis.jump);
    if (this.page !== this.pages) await this.clientMessage.message.react(this.emojis.forward);
    await this.clientMessage.message.react(this.emojis.delete);

    this._awaitResponse();
  }

  /**
   * Initialises the MessageEmbed.
   * @private
   * @protected
   * @param {boolean} [callNavigation=true] - Whether to call _drawNavigation() or not.
   */
  async _loadList(callNavigation = true) {
    const shouldIndicate = this.showPageIndicator
      ? this.pages === 1
        ? null
        : `Page ${this.page} of ${this.pages}`
      : null;

    await this.clientMessage.message.edit(shouldIndicate, { embed: this.currentEmbed });

    if (callNavigation) return this._drawNavigation();

    this.clientMessage.message.react(this.emojis.delete);
  }

  /**
   * Calls PaginationEmbeds.setPage().
   * @private
   * @protected
   * @param {number} param - The page number to jump to. As String: 'back', 'forward'
   */
  async _loadPage(param = 1) {
    const oldPage = this.page;
    this.setPage(param);

    if (oldPage === 1 || oldPage === this.pages || this.page === 1 || this.page === this.pages) {
      await this.clientMessage.message.reactions.removeAll();

      this._loadList(true);
    } else {
      await this._loadList(false);

      this._awaitResponse();
    }
  }

  /**
   * Awaits the reaction from the user.
   * @private
   * @protected
   */
  async _awaitResponse() {
    const emojis = Object.values(this.emojis);
    const filter = (r, u) => {
      if (this.authorisedUser)
        return u.id === this.authorisedUser.id && emojis.includes(r.emoji.name);

      return !u.bot && emojis.includes(r.emoji.name);
    };
    const clientMessage = this.clientMessage.message;

    try {
      const responses = await clientMessage.awaitReactions(filter, { max: 1, time: this.timeout, errors: ['time'] });
      const response = responses.first();
      const user = response.users.last();
      const emoji = response.emoji.name;

      if (emoji === this.emojis.delete) return clientMessage.delete();

      await response.users.remove(user);

      switch (emoji) {
        case this.emojis.back:
          if (this.page === 1) return this._awaitResponse();

          this._loadPage('back');
          break;

        case this.emojis.jump:
          if (this.pages <= 2) return this._awaitResponse();

          this._awaitResponseEx(user);
          break;

        case this.emojis.forward:
          if (this.page === this.pages) return this._awaitResponse();

          this._loadPage('forward');
          break;
      }
    } catch (c) {
      clientMessage.reactions.removeAll().catch(err => {
        throw err;
      });

      if (c instanceof Error) throw c;
    }
  }

  /**
   * Awaits the custom page input from the user.
   * @private
   * @protected
   * @param {User} user - The user who reacted to jump on a certain page.
   */
  async _awaitResponseEx(user) {
    const filter = m => {
      const supposedPage = parseInt(m.content);

      return (
        m.author.id === user.id && (
          (!isNaN(m.content) && supposedPage !== this.page && supposedPage >= 1 && supposedPage <= this.pages) ||
          m.content.toLowerCase() === 'cancel'
        )
      );
    };
    const channel = this.clientMessage.message.channel;
    const prompt = await channel.send('To what page would you like to jump? Say `cancel` to cancel the prompt.');

    try {
      const responses = await channel.awaitMessages(filter, { max: 1, time: this.timeout, errors: ['time'] });
      const response = responses.first();
      let content = response.content;

      await prompt.delete();
      await response.delete();

      if (content === 'cancel') return this._awaitResponse();

      content = parseInt(content);

      this._loadPage(content);
    } catch (c) {
      prompt.delete().catch(err => {
        throw err;
      });

      if (c instanceof Error) throw c;
    }
  }
}

module.exports = PaginationEmbeds;
