/**
 * Model for describing and managing user resources in the database
 */
module.exports = function resource(db, conn, mongodb) {
  const collection = conn.collection('resource');
  db.resource = {
    create(manifoldId = '', product = '', plan = '', region = '') {
      // TODO: Enforce uniqueness by manifold id and return error
      return collection.insert({
        manifoldId,
        product,
        plan,
        region
      }).then((res) => {
        return res.ops[0]._id;
      });
    },
    get(manifoldId = '') {
      return collection.find({
        manifoldId
      }).toArray().then((docs) => {
        return docs[0];
      });
    },
    update(manifoldId = '', plan = '') {
      return db.resource.get(manifoldId).then((res) => {
        if (!res) {
          throw new Error('Resource does not exist!');
        }
        // Update
        res.plan = plan;
        return collection.update({
          _id: res._id
        }, res);
      });
    },
    delete(manifoldId = '') {
      return collection.remove({
        manifoldId
      });
    }
  };
};
