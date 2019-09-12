#!/usr/bin/env node

require('dotenv').config();
const db = require('./db');
const Notification = require('./Notification');
const leagues = require('./leagues');
const transactions = require('./transactions');
const User = require('./User');

/* eslint-disable no-await-in-loop */
(async function run() {
  const users = await User.find().exec();
  for (const user of users) { // eslint-disable-line no-restricted-syntax
    try {
      console.log(`Checking leagues for ${user.email}`);
      const notification = new Notification(user);
      if (user.expires < new Date()) { await user.renewToken(); }
      await leagues.updateForUser(user);
      for (const league of user.leagues) { // eslint-disable-line no-restricted-syntax
        const allTransactions = await transactions.getAll(league, user);
        notification.addTransactions(
          league,
          transactions.filterNew(league, allTransactions),
        );
        league.lastNotifiedTransaction = allTransactions
          && allTransactions.length
          && allTransactions[0].key;
      }
      await notification.send();
      await user.save();
    } catch (err) {
      console.error(err.stack);
    }
  }
  db.close();
}());
/* eslint-enable no-await-in-loop */