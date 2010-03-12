$(document).ready(function() {
  
  // This is my little helper function which creates a new task
  // Pass in the tasks id and revision as provided by couchdb
  var create_new_task = function(id, rev, text) {
    // jQuery lets me create this task item really easyly, i use an input element so it can be changed later on
    item = $('<div class="task" id="' + id + '"><span class="delete" title="delete">X</span> <input/></div>');
    // By using .val() all the content is properly escaped, so nothing gets injected accidentally
    item.find('input').val(text);
    // Here i use a lesser known feature of jQuery which lets me attach any kind of data to any dom element
    item.data('rev', rev);
    // and finally throw it in there!
    $('#tasklist').append(item);
    $('#newtask').focus();
  };

  // Here is the ajax call to load existing tasks, which is executed just once on startup
  $.ajax({
    // This is where the view in the views folder is called
    // if your database has a different name than "taskmanager" you'd need to change it here
    url: '/taskmanager/_design/taskmanager/_view/alltasks',
    type: 'GET',
    success: function(data) {
      // The JSON object is available from json2.js
      result = JSON.parse(data);
      for (i = 0; i < result.total_rows; i++) {
        // This is the call to the helper function, duh
        create_new_task(
          result.rows[i].value._id,  
          result.rows[i].value._rev,
          result.rows[i].value.task
        );
      }
    }
  });

  // This is called when the lower form is submitted (enter was pressed), which means, a new task is created
  $('#taskform').submit(function() {
    timestamp = new Date().toJSON();
    // create an object where the task is stored
    newtask = {task: $(this).find('#newtask').val(), createdAt: timestamp};
    if ($.trim(newtask.task) !== "") {
      // This ajax call is a little different from th previous one,
      // because it uses the couchdb document api, which lets me 
      // create new documents by posting them to the database url
      // on success the item is added to the list
      $.ajax({
        url: '/taskmanager',
        data: JSON.stringify(newtask),
        type: 'POST',
        success: function(data) {
          result = JSON.parse(data);
          create_new_task(
            result.id,
            result.rev,
            newtask.task
          );
        }
      });
      $(this).find('#newtask').val("");
    }
    // don't actually submit the form
    return false;
  });
  
  // when a red X is clicked, the task item is deleted
  $('#tasklist .delete').live('click', function() {
    // retrieve the revision information that was attached earlier
    rev = $(this).parent().data('rev');
    // also get the id, which is stored in the id attribute
    curid = $(this).parent().attr('id');
    // remove it from the page
    $(this).parent().remove();
    // and remove it from the database
    // this is also done using the couchdb document api with a http delete request (nice!)
    $.ajax({
      url: '/taskmanager/' + curid + '?rev=' + rev,
      type: 'DELETE'
    });
  });

  // and finally when any of the existing items is changed i want this change to be stored in the database too
  // i love how jQuery lets me bind this change events to any current and future elements
  $('#tasklist input').live('change', function() {
      // get the new task text
      text = $(this).val();
      // again, get its id and revision
      rev = $(this).parent().data('rev');
      curid = $(this).parent().attr('id');
      // create an object to post to the db
      task = {'_rev': rev, 'task' : text}
      // again, this uses the couchdb document api directly, the update is done by a http put request
      $.ajax({
        url: '/taskmanager/' + curid,
        data: JSON.stringify(task),
        type: 'PUT',
        // once the task has been saved to the database we need to update the revision in the dom element for future updates
        success: function(data) {
          result = JSON.parse(data);
          $('#' + curid).data('rev', result.rev);
        }
      });
  });

});
