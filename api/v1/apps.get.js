module.exports = {
  auth: true,
  handler(req, res) {
    res.send(`I am alive! -- Hello ${req.session.user}`);
  }
};
