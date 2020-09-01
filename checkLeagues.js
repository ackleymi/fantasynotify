#!/usr/bin/env node

require('dotenv').config();
const db = require('./db');
const Notification = require('./Notification');
const leagues = require('./leagues');
const transactions = require('./transactions');
const User = require('./User');

const minutes = 5;
const theInterval = minutes * 60 * 1000;

/* eslint-disable no-await-in-loop */
async function run() {
  console.log('start');
  const users = await User.find().exec();
  // eslint-disable-next-line no-restricted-syntax
  for (const user of users) {
    try {
      console.log(`Checking leagues for ${user.email}`);
      const notification = new Notification();
      if (user.expires < new Date()) {
        await user.renewToken();
      }
      await leagues.updateForUser(user);
      // eslint-disable-next-line no-restricted-syntax
      for (const league of user.leagues) {
        const allTransactions = await transactions.getAll(league, user);
        const toSend = transactions.filterNew(league, allTransactions);
        console.log(`Found ${toSend.length} new transaction(s)`);
        notification.addTransactions(
          toSend.reverse(),
        );
        league.lastNotifiedTransaction =
          allTransactions && allTransactions.length && allTransactions[0].key;
      }
      await notification.send();
      await user.save();
    } catch (err) {
      console.error(err.stack);
      if (err.body && err.body.error === 'INVALID_REFRESH_TOKEN') {
        console.log(`Deleting user '${user.email}' with invalid refresh token`);
        await user.remove();
      }
    }
  }
  console.log('done');

}
/* eslint-enable no-await-in-loop */
process.on('SIGINT', () => {
  db.close();
  console.log('Mongoose disconnected on app termination');
  process.exit(0);
});

run();
setInterval(run, theInterval);
