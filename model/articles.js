var mongoose = require('mongoose');
var articleSchema = new mongoose.Schema({
  name: String,
  body: String,
  published: { type: Date, default: Date.now },
  isloved: Boolean
});
mongoose.model('Article', articleSchema);
