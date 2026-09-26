/** Keep all Jest workers in UTC so date and event formatting is deterministic. */
module.exports = async function setTestTimezoneToUtc() {
  process.env.TZ = 'UTC';
};
