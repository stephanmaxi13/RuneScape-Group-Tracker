/* eslint-disable */
use('test');

db.players.find({}, { username: 1, snapshots: 1 }).forEach(p => {
  print(`Stored Username: "${p.username}"`); // The quotes help see spaces
  print(`Snapshot Count: ${p.snapshots ? p.snapshots.length : 0}`);
  if (p.snapshots.length > 0) {
    print(`Latest Snapshot: ${p.snapshots[p.snapshots.length - 1].timeStamp}`);
  }
  print('---');
});