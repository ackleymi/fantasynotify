const { Webhook, MessageBuilder } = require('discord-webhook-node');
const moment = require('moment-timezone');

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

    this.leagueTransactions.forEach(transaction => {
      const t = moment.unix(transaction.timestamp).tz("America/New_York").format('llll');
      console.log(t);
      let team;
      const embed = new MessageBuilder()
        .setColor('#00b0f4')
        .setFooter(t);

      transaction.players.forEach(player => {
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
      });
      embed.setTitle(`New transaction by ${team}`);

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
    });

    return null;
  }
};
