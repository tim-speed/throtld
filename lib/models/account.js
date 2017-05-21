/**
 * Model for describing and managing user accounts in the database
 */
module.exports = function account(db, conn, mongodb) {
  const collection = conn.collection('account');
  db.account = {
    create(name = '', secret = '') {
      return collection.insert({
        name,
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
    getByName(name = '') {
      return collection.find({
        name
      }).toArray().then((docs) => {
        return docs[0];
      });
    },
    delete(id = '') {
      return collection.remove({
        _id: new mongodb.ObjectID(id)
      });
    }
  };
};
