const alertStore = {
  alerts: [],

  add(alerts) {
    this.alerts.push(...alerts);
  },

  list() {
    return this.alerts;
  },

  clear() {
    this.alerts = [];
  }
};

module.exports = alertStore;
