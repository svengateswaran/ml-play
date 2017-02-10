function AddClassSpecificColumn(classes, table) {
  var css_text =
    document.defaultView.getComputedStyle(table.rows[0].cells[0], "").cssText;
  for (var i = 0; i < classes.length; i++) {
    var new_class = table.rows[0].insertCell();
    new_class.innerHTML = "s[" + i + "]"
    new_class.style.cssText = css_text;
  }
  var loss_column = table.rows[0].insertCell();
  loss_column.innerHTML = "L";
  loss_column.style.cssText = css_text;
}

function AddPointToTable(table, classes, point, data) {
  var table_row = table.insertRow();
  var table_x = table_row.insertCell(0);
  var table_y = table_row.insertCell(1);
  var table_data = table_row.insertCell(2);
  table_x.innerHTML = Math.floor(point.x);
  table_y.innerHTML = Math.floor(point.y);
  table_data.innerHTML = data;
  for (var i = 0; i < classes.length; i++) {
    var class_cell = table_row.insertCell();
    class_cell.innerHTML = "0";
  }
  var loss_cell = table_row.insertCell();
  loss_cell.innerHTML = "NA";
  ComputeLoss();
}

function CreateParameterCell(name) {
  var name = "<div>" + name + "</div>";
  var up = "<div class='controls'>▲</div>";
  var data = "<div>0</div>";
  var diff = "<div>0</div>";
  var down = "<div class='controls'>▼</div>";
  var parameter_cell = name +
                       up +
                       data +
                       diff +
                       down;
  return parameter_cell;
}

function CreateParametersTable(classes, table) {
  for(var i = 0; i < classes.length; i++) {
    var table_row = table.insertRow();
    var table_w0 = table_row.insertCell(0);
    var table_w1 = table_row.insertCell(1);
    var table_b = table_row.insertCell(2);
    table_w0.innerHTML = CreateParameterCell("W[" + i + "][0]");
    table_w1.innerHTML = CreateParameterCell("W[" + i + "][1]");
    table_b.innerHTML = CreateParameterCell("B[" + i + "]");
  }
}

/* Function to calculate the loss */
function ComputeLoss() {
  var param_table = document.getElementById("parameters_table");
  var data_table = document.getElementById("data_table").getElementsByTagName('tbody')[0];

  for (var i = 0; i < data_table.rows.length; i++) {

    var row = data_table.rows[i];
    var x0 = parseFloat(row.cells[0].innerHTML);
    var x1 = parseFloat(row.cells[1].innerHTML);
    var y = parseFloat(row.cells[2].innerHTML);
    var s_i = [];
    
    for (var c = 0; c < classes.length; c++) {

      /* Retrieve parameters from the table for the specific class */
      var w0 = parseFloat($(param_table.rows[c].cells[0]).children()[2].innerHTML);
      var w1 = parseFloat($(param_table.rows[c].cells[1]).children()[2].innerHTML);
      var b = parseFloat($(param_table.rows[c].cells[2]).children()[2].innerHTML);
      var s = x0 * w0 + x1 * w1 + b;

      /* Update result on the table */
      row.cells[3 + c].innerHTML = s;

      /* Update classifier lines */
      var classifier_line = classifier_lines[c];

      var x0 = -canvas_width / 2;
      var x1 = canvas_width / 2;
      var y0 = 0;
      var y1 = 0;
      
      if (w1 != 0) {
        y0 = -((w0*x0) + b) / w1  ;
        y1 = -((w0*x1) + b) / w1;
      }
      
      classifier_line.segments[0].point.x = x0 + canvas_width/2;
      classifier_line.segments[1].point.x = x1 + canvas_width/2;
      classifier_line.segments[0].point.y = y0 + canvas_height/2;
      classifier_line.segments[1].point.y = y1 + canvas_height/2;

      paper.view.draw();
      s_i.push(s);
    }
    
    var l = 0;

    for (var c = 0; c < classes.length; c++) {
      if (y != c)
        l += Math.max(0, s_i[c] - s_i[y] + 1);
    }
    
    /* Update loss on the table */
    row.cells[3 + classes.length].innerHTML = l;
  }
}

$(document).ready(function(){

  paper.install(window);
  var canvas = document.getElementById('canvas_container');
  canvas_width = canvas.clientWidth;
  canvas_height = canvas.clientHeight;
  console.log("canvas_height : " + canvas_height);
  console.log("canvas_width : " + canvas_width);
  paper.setup(canvas);

  var background = new Shape.Rectangle({
      rectangle: view.bounds,
      fillColor: "#555555"
  });

  var tool = new Tool();

  /* classes are identified by the HEX color code */
  classes = ["#E03131", "#31E031"]

  /* Group to hold the data points */
  var data_points = new Group();

  var data_table_header = document.getElementById("data_table").getElementsByTagName('thead')[0];
  var data_table = document.getElementById("data_table").getElementsByTagName('tbody')[0];

  var param_table = document.getElementById("parameters_table");

  AddClassSpecificColumn(classes, data_table_header);

  CreateParametersTable(classes, param_table);

  /* Drawing Axis */
  var x_axis = new Path(new Point(0, canvas_height/2),
                        new Point(canvas_width, canvas_height/2));
  var y_axis = new Path(new Point(canvas_width/2, 0),
                        new Point(canvas_width/2, canvas_height));
  x_axis.strokeColor = "#fff";
  y_axis.strokeColor = "#fff";

  /* Drawing classifier specific lines */
  classifier_lines = [];
  for (var i = 0; i < classes.length; i++) {
    var classifier_line = new Path.Line(new Point(0, 0),
                                   new Point(300, 150 + i * 50));
    classifier_line.strokeColor = classes[i];
    classifier_line.strokeWidth = 2;
  classifier_lines.push(classifier_line);
  }

  /* Drawing Hypothesis(decision boundary) line */
  var hypothesis_line = new Path(new Point(canvas_width + 1, 0),
                                 new Point(0, canvas_height + 1));
  hypothesis_line.strokeColor = "#DDDD12";
  hypothesis_line.strokeWidth = 2;

  /* Mouse click event to create data points on the canvas */
  tool.onMouseDown = function(event) {
    var new_circle = new Path.Circle(new Point(event.point), 5);

    var cur_class_radio = document.getElementsByName("data_class");
    for(var i = 0; i < cur_class_radio.length; i++) {
      if(cur_class_radio[i].checked == true)
        break;
    }
    var cur_class = i; /* class id */
    new_circle.fillColor = classes[i];

    data_points.addChild(new_circle);
    var new_point = new Point(new_circle.position.x - canvas_width / 2,
                              -(new_circle.position.y - canvas_height / 2));
    AddPointToTable(data_table, classes, new_point, cur_class);
  }

//  Just an Fun Animation till things get Ready
  /*
  view.onFrame = function(event) {
    data_points.rotate(1);
    hypothesis_line.rotate(-1);
    paper.view.draw();
  }
  */

  /*
   * This event is to change the parameters manually
   */
  $(".controls").click(function(){
    var up = $(this).parent().children()[1];
    var data = $(this).parent().children()[2];
    var diff = $(this).parent().children()[3];
    var down = $(this).parent().children()[4];

    var control_type = $(this)[0].innerHTML;
    if (control_type.localeCompare("▲") == 0)
      data.innerHTML = parseInt(data.innerHTML) + 1;
    else
      data.innerHTML = parseInt(data.innerHTML) - 1;

    ComputeLoss();
  });
});
