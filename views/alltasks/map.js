function(doc) {
  if (doc.task) {
    emit([doc.createdAt, doc._id], doc);
  }
};
