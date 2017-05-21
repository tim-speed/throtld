/**
 * Model for describing and managing users in the database.
 */
module.exports = function user(db, conn, mongodb) {
  const collection = conn.collection('user');
  db.user = {
    get(id = '') {
      // Get user
      return collection.find({
        _id: new mongodb.ObjectID(id)
      }).toArray().then((docs) => {
        return docs[0];
      });
    },
    getBySubjectId(id = '') {
      // Get user
      return collection.find({
        subject: id
      }).toArray().then((docs) => {
        return docs[0];
      });
    },
    create(userDoc) {
      // TODO: Make userDoc subjectId unique and create an index on it
      return collection.insert(userDoc).then((res) => {
        return res.ops[0]._id;
      });
    },
    update(userDoc) {
      // Get app
      const id = userDoc._id instanceof mongodb.ObjectID ? userDoc._id :
        new mongodb.ObjectID(userDoc._id);
      delete userDoc._id;
      return collection.update({
        _id: id
      }, user);
    },
    delete(id = '') {
      return collection.remove({
        _id: new mongodb.ObjectID(id)
      });
    }
  };
};
