$(document).ready(function() {

  var create_new_task = function(id, rev, text) {
    item = $('<div class="task" id="' + id + '"><span class="delete" title="delete">X</span> <input/></div>');
    item.find('input').val(text);
    item.data('rev', rev);
    $('#tasklist').append(item);
    $('#newtask').focus();
  };

  // Load existing tasks
  $.ajax({
    url: '/taskmanager/_design/taskmanagercouchapp/_view/alltasks',
    type: 'GET',
    success: function(data) {
      result = JSON.parse(data);
      for (i = 0; i < result.total_rows; i++) {
        create_new_task(
          result.rows[i].key._id,  
          result.rows[i].key._rev,
          result.rows[i].key.task
        );
      }
    }
  });

  // Create a new task
  $('#taskform').submit(function() {
    newtask = {task: $(this).find('#newtask').val()};
    if ($.trim(newtask.task) !== "") {
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
    return false;
  });
  
  // remove tasks
  $('#tasklist .delete').live('click', function() {
    $('#newtask').focus();
    rev = $(this).parent().data('rev');
    curid = $(this).parent().attr('id');
    $(this).parent().remove();
    $.ajax({
      url: '/taskmanager/' + curid + '?rev=' + rev,
      type: 'DELETE'
    });
  });

  // edit tasks
  $('#tasklist input').live('change', function() {
      text = $(this).val();
      rev = $(this).parent().data('rev');
      curid = $(this).parent().attr('id');
      task = {'_rev': rev, 'task' : text}
      $.ajax({
        url: '/taskmanager/' + curid,
        data: JSON.stringify(task),
        type: 'PUT',
        // once the task has been saved to the database we need to update the revision
        success: function(data) {
          result = JSON.parse(data);
          $('#' + curid).data('rev', result.rev);
        }
      });
    $('#newtask').focus();
  });

});
