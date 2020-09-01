const { Webhook, MessageBuilder } = require('discord-webhook-node');
const moment = require('moment');

const hook = new Webhook(process.env.WEBHOOK_URL);

module.exports = class Notification {
  constructor(hooker = hook) {
    this.leagueTransactions = [];
    this.hooker = hooker;
  }

  addTransactions(transactions) {
    if (!transactions || !transactions.length) {
      return;
    }
    this.leagueTransactions = transactions;
  }

  send() {
    if (!Object.entries(this.leagueTransactions).length) {
      return null;
    }

    for (const transaction of this.leagueTransactions) {
      let t = moment.unix(transaction.timestamp).format('llll');
      let team;
      let embed = new MessageBuilder()
        .setColor('#00b0f4')
        .setFooter(t);

      for (const player of transaction.players) {
        let source = '';
        let action;
        if (player.type === 'add') {
          action = 'Added';
          team = player.destination_team_name;
          if (player.source_type === 'waivers') {
            source = 'from waivers';
          } else if (player.source_type === 'freeagents') {
            source = 'from free agents';
          }
        } else {
          action = 'Dropped';
          team = player.source_team_name;
          if (player.destination_type === 'waivers') {
            source = 'to waivers';
          } else if (player.destination_type === 'freeagents') {
            source = 'to free agents';
          }
        }
        embed.addField(`${action} ${source}`, player.name, false);
      }
      embed.setTitle(team);

      (async () => {
        try {
          //
          await this.hooker.send(embed);
          console.log('Successfully sent webhook!');
        }
        catch (e) {
          console.log(e.message);
        };
      })();
    }
    return null;
  }
};
