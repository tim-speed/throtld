const ProgressBar = require('progress');

module.exports = {
  testRunId: Math.random().toString(36).slice(2),
  makeProgressBar(name) {
    const progressBar = new ProgressBar(`${name} [:bar] :percent :etas`, {
      total: 100,
      width: 20
    });
    let lastProgress;
    progressBar.progress = function progress(val) {
      val = Math.floor(val * 100);
      if (val !== lastProgress) {
        progressBar.tick(val - (lastProgress || 0));
        lastProgress = val;
      }
    };
    return progressBar;
  }
};
