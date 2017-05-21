/**
 * Model for describing and managing apps in the database.
 */
module.exports = function app(db, conn, mongodb) {
  const collection = conn.collection('app');
  db.app = {
    create(account = '', secret = '') {
      // TODO: Make secrets unique to the App, no other App should have the
      //  same secret for security.
      return collection.insert({
        account,
        secret
      }).then((res) => {
        return res.ops[0]._id;
      });
    },
    get(id = '') {
      return collection.find({
        _id: new mongodb.ObjectID(id)
      }).toArray().then((docs) => {
        return docs[0];
      });
    },
    all(account = '') {
      return collection.find({
        account
      }).toArray().then((docs) => {
        return docs;
      });
    },
    delete(id = '') {
      return collection.remove({
        _id: new mongodb.ObjectID(id)
      });
    }
  };
};
