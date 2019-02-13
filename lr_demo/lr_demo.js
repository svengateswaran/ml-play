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
  table_x.innerHTML = point.x.toFixed(2);
  table_y.innerHTML = point.y.toFixed(2);
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

  var data_value = (Math.random() * (Math.random() > 0.5 ? 1 : -1)).toFixed(2);

  var name = "<div>" + name + "</div>";
  var up = "<div class='controls'>▲</div>";
  var data = "<div>" + data_value + "</div>";
  var diff = "<div style='font-style: italic; color:#E03131'>0</div>";
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

function Inference() {
  var wb = [];
  for (var c = 0; c < classes.length; c++) {
    var w0 = parseFloat($(param_table.rows[c].cells[0]).children()[2].innerHTML);
    var w1 = parseFloat($(param_table.rows[c].cells[1]).children()[2].innerHTML);
    var b  = parseFloat($(param_table.rows[c].cells[2]).children()[2].innerHTML);
    wb.push([w0, w1, b]);  
  }

  for (var i = 0; i < canvas_height; i++) {
    for (var j = 0; j < canvas_width; j++) {
      var background_point = background_points[i * (canvas_width) + j];
      var x0 = (( (j - (canvas_width  / 2))) / 100.0).toFixed(2);
      var x1 = ((-(i - (canvas_height / 2))) / 100.0).toFixed(2);
      var max_score = [-1000000000, -1];
      for (var k = 0; k < classes.length; k++) {
        var s = x0 * wb[k][0] + x1 * wb[k][1] + wb[k][2];  
        max_score[0] = Math.max(max_score[0], s);
        if(max_score[0] == s)
          max_score[1] = k;
      }
      background_point.strokeColor = classes[max_score[1]];

    }
  }

  paper.view.draw();
}


function GradientDescent() {

  learning_rate = 0.1;

  ComputeLoss();

  /*
   * Initialize Local Weights and Gradients
   */
  var d_w0 = [];
  var d_w1 = [];
  var d_b  = [];

  var w_w0 = [];
  var w_w1 = [];
  var w_b  = [];
  
  for (var c = 0; c < classes.length; c++) {
    d_w0.push(0);
    d_w1.push(0);
    d_b.push(0);

    w_w0.push(parseFloat($(param_table.rows[c].cells[0]).children()[2].innerHTML));
    w_w1.push(parseFloat($(param_table.rows[c].cells[1]).children()[2].innerHTML));
    w_b.push(parseFloat($(param_table.rows[c].cells[2]).children()[2].innerHTML));

  }

  /*
   * Calculating Gradients
   */
  var num_data = parseFloat(data_table.rows.length);
  for (var i = 0; i < num_data; i++) {

    var row = data_table.rows[i];
    var x0  = parseFloat(row.cells[0].innerHTML);
    var x1  = parseFloat(row.cells[1].innerHTML);
    var y   = parseFloat(row.cells[2].innerHTML);
    var s_i = [];
    
    for (var c = 0; c < classes.length; c++)
      s_i.push(parseFloat(row.cells[3 + c].innerHTML));
  
    l_yi = 0;
    for (var c = 0; c < classes.length; c++) {
      if (y != c)
        l_yi += ((s_i[c] - s_i[y] + 1) > 0);
    }

    /* Sum the gradients of each data point to take Mean */
    for (var j = 0; j < classes.length; j++) {
      if (j == y) {
        d_w0[j] += l_yi * -(x0);
        d_w1[j] += l_yi * -(x1);
        d_b[j]  += l_yi * -1;
      } else {
        l_ij = ((s_i[j] - s_i[y] + 1) > 0);
        d_w0[j] += l_ij * x0;
        d_w1[j] += l_ij * x1;
        d_b[j]  += l_ij;
      } 
    }
  }

  /*
   * Calculating Mean of Gradients & Updating Weights
   *
   * Also Update the params table
   */
  for (var c = 0; c < classes.length; c++) {

    /* calculate mean */
    d_w0[c] /= num_data;
    d_w1[c] /= num_data;
    d_b[c]  /= num_data;
    
    /* Update Weights */
    w_w0[c] -= (learning_rate * d_w0[c]);
    w_w1[c] -= (learning_rate * d_w1[c]);
    w_b[c]  -= (learning_rate * d_b[c]);

    /* Update gradients in params table */
    $(param_table.rows[c].cells[0]).children()[3].innerHTML = d_w0[c].toFixed(2);
    $(param_table.rows[c].cells[1]).children()[3].innerHTML = d_w1[c].toFixed(2);
    $(param_table.rows[c].cells[2]).children()[3].innerHTML = d_b[c].toFixed(2);
  

    /* Update Weights in params table */
    
    $(param_table.rows[c].cells[0]).children()[2].innerHTML = w_w0[c].toFixed(2);
    $(param_table.rows[c].cells[1]).children()[2].innerHTML = w_w1[c].toFixed(2);
    $(param_table.rows[c].cells[2]).children()[2].innerHTML = w_b[c].toFixed(2);
    
  }

  loss.shift();
  loss.push(parseFloat(avg_loss));

  loss_canvas.activate();
  // console.log(loss);

  for (var i = 0; i < loss.length; i++) {
    loss_lines[i].segments[0].point.y = loss_length - loss[i];

    if (i == loss.length - 1)
      loss_lines[i].segments[1].point.y = loss_length - loss[i];
    else
      loss_lines[i].segments[1].point.y = loss_length - loss[i + 1];
  }

  paper.view.draw();

  counter += 1;
  
  if (counter % 10 == 0) {
    console.log("iterations : " + counter);

    console.log(d_w0);
    console.log(d_w1);
    console.log(d_b);
    
    console.log(loss);
  }

  Inference();
}

/* Function to calculate the loss */
function ComputeLoss() {
  var loss_sum = 0;

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
      var s = (x0 * w0 + x1 * w1 + b);

      console.log("-------------------------------------------")
      console.log("i : " + i + " | " + " c : " + c)
      console.log("x0 : " + x0 + " | " + "w0 : " + w0 + " | " + "x1 : " + x1 + " | " + "w1 : " + w1 + " | " + "b : " + b);
      console.log("s : " + s)

      /* Update result on the table */
      row.cells[3 + c].innerHTML = s.toFixed(2);

      /* Update classifier lines */
      var classifier_weight_line = classifier_weight_lines[c];
      var classifier_arrow = classifier_arrows[c];

      var classifier_line = classifier_lines[c];

      var lx0 = -canvas_width / 2;
      var lx1 = canvas_width / 2;

      var lw0 = w0 * 100;
      var lw1 = w1 * 100;
      var lb  = b * 100;


      var ly0 = lb;
      var ly1 = lb;

      var m =  - (lw0 / (lw1 - lb));

      if ((lw1 - b) != 0) {
        ly0 =  m * lx0 + lb;
        ly1 =  m * lx1 + lb;
      }
      
      classifier_line.segments[0].point.x = lx0 + canvas_width/2;
      classifier_line.segments[0].point.y = ly0 + canvas_height/2;

      classifier_line.segments[1].point.x = lx1 + canvas_width/2;
      classifier_line.segments[1].point.y = ly1 + canvas_height/2;


      classifier_weight_line.segments[0].point.y = (b  * 100) + canvas_height/2;
      classifier_weight_line.segments[1].point.x = (w0 * 100) + canvas_width/2;
      classifier_weight_line.segments[1].point.y = (w1 * 100) + canvas_height/2;

      classifier_arrow.position.x = (w0 * 100) + canvas_width/2;
      classifier_arrow.position.y = (w1 * 100) + canvas_height/2;


      paper.view.draw();
      s_i.push(s);
    }
    
    var l = 0;

    for (var c = 0; c < classes.length; c++) {
      if (y != c)
        l += Math.max(0, s_i[c] - s_i[y] + 1);
    }

    /* Update loss on the table */
    row.cells[3 + classes.length].innerHTML = l.toFixed(2);

    loss_sum += l
  }


  avg_loss = (loss_sum / parseFloat(data_table.rows.length));
  document.getElementById("loss_mean_value").innerHTML = avg_loss.toFixed(2);
}

function CreateDataPoint(x, y, c) {

  var new_point = new Point(x * 100 + canvas_width/2 , -(y * 100 - canvas_height/2));
  var new_circle = new Path.Circle(new_point, 5);

  new_circle.fillColor = classes[c];
  new_circle.strokeColor = "#fff";

  data_points.addChild(new_circle);
  AddPointToTable(data_table, classes, new Point(x, y), c);

}

function GetRandomValue(scale, precision) {
 return (Math.random() * scale).toFixed(precision) * (Math.random() > 0.5 ? 1 : -1);
}
$(document).ready(function(){

  paper.install(window);
  canvas = document.getElementById('canvas_container');
  canvas_width = canvas.clientWidth + 2;
  canvas_height = canvas.clientHeight + 2;
  console.log("canvas_height : " + canvas_height);
  console.log("canvas_width : " + canvas_width);
  vis_canvas = new paper.PaperScope();
  vis_canvas.setup(canvas);

  window.paper = vis_canvas;
  paper.install(window);

  var background = new Shape.Rectangle({
      rectangle: view.bounds,
      fillColor: "#fff"
  });

  
  background_points = [];

  for (var i = 0; i < canvas_height; i++) {
    for (var j = 0; j < canvas_width; j++) {

      var background_point = new Path.Line(new Point(j, i), new Point(j+1, i), 1);
      background_point.strokeColor = "#555";
      background_point.opacity = 0.3;
      background_points.push(background_point);
    }
  }
 

  var tool = new Tool();

  /* classes are identified by the HEX color code */
  classes = ["#E03131", "#31E031", "#3131E0"]
  //classes = ["#E03131", "#31E031"]

  var data_controls = document.getElementById("data_controls");
  for (var i = 2; i < classes.length; i++) {
    var input = document.createElement("input");
    input.type = "radio";
    input.name = "data_class";
    input.value = i.toString();
    data_controls.append(input);
    data_controls.innerHTML += " " + input.value + "<br>";
  }

  loss_canvas_elmt = document.getElementById('canvas_loss');

  loss_length = loss_canvas_elmt.clientWidth; 

  loss_scale = 2;

  loss = new Array(loss_length / loss_scale);

  loss_canvas = new paper.PaperScope();
  loss_canvas.setup(loss_canvas_elmt);

  loss_lines = []
  for (var i = 0; i < loss.length; i++) {
    var loss_line = new Path.Line(new Point(i * loss_scale, 0),
                                  new Point((i+1) * loss_scale, 0));
    loss_line.strokeColor = "#E03131";
    loss_line.strokeWidth = 1;
    loss_lines.push(loss_line);
  }

  vis_canvas.activate();

  /* Group to hold the data points */
  data_points = new Group();

  var data_table_header = document.getElementById("data_table").getElementsByTagName('thead')[0];
  data_table = document.getElementById("data_table").getElementsByTagName('tbody')[0];

  param_table = document.getElementById("parameters_table");

  AddClassSpecificColumn(classes, data_table_header);

  CreateParametersTable(classes, param_table);

  /* Drawing Axis */
  var x_axis = new Path(new Point(0, canvas_height/2),
                        new Point(canvas_width, canvas_height/2));
  var y_axis = new Path(new Point(canvas_width/2, 0),
                        new Point(canvas_width/2, canvas_height));
  x_axis.strokeColor = "#000";
  y_axis.strokeColor = "#000";

  /* Drawing classifier specific lines */
  classifier_lines = [];
  classifier_weight_lines = [];
  classifier_arrows = [];

  for (var i = 0; i < classes.length; i++) {

    var classifier_line = new Path.Line(new Point(0, 0),
                                   new Point(300, 150 + i * 50));
    classifier_line.strokeColor = classes[i];
    classifier_line.strokeWidth = 2;
    classifier_lines.push(classifier_line);

    var classifier_weight_line = new Path.Line(new Point(canvas_width/2, canvas_height/2),
                                   new Point(300, 150 + i * 50));
    classifier_weight_line.strokeColor = classes[i];
    classifier_weight_line.strokeWidth = 2;
    classifier_weight_lines.push(classifier_weight_line);

    //var classifier_arrow = new Path.RegularPolygon(new Point(canvas_width/2, canvas_height/2), 3, 30);
    var classifier_arrow = new Path.Circle(new Point(canvas_width/2, canvas_height/2), 3);
    classifier_arrow.fillColor = classes[i];
    classifier_arrow.strokeColor = "#fff";
    classifier_arrow.strokeWidth = 1;
    classifier_arrows.push(classifier_arrow);
  }

  /* Drawing Hypothesis(decision boundary) line */
  // var hypothesis_line = new Path(new Point(canvas_width + 1, 0),
  //                                new Point(0, canvas_height + 1));
  // hypothesis_line.strokeColor = "#DDDD12";
  // hypothesis_line.strokeWidth = 2;

  /* Load sample points */

  var num_sample_points = 1;

  for(var i = 0; i < classes.length; i++) {
    for (var j = 0; j < num_sample_points; j++) {
       var r_x = GetRandomValue(1, 2);
       var r_y = GetRandomValue(1, 2);
       CreateDataPoint(r_x, r_y, i);
    }
  }

  /* Mouse click event to create data points on the canvas */
  tool.onMouseDown = function(event) {

    var cur_class_radio = document.getElementsByName("data_class");
    for(var i = 0; i < cur_class_radio.length; i++) {
      if(cur_class_radio[i].checked == true)
        break;
    }

    CreateDataPoint((event.point.x - canvas_width/2) / 100, - ((event.point.y - canvas_height/2)) / 100, i);
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

  num_iterations = 4000;
  mod_value = .1;

  $(".controls").click(function(){
    var up = $(this).parent().children()[1];
    var data = $(this).parent().children()[2];
    var diff = $(this).parent().children()[3];
    var down = $(this).parent().children()[4];

    var control_type = $(this)[0].innerHTML;
    if (control_type.localeCompare("▲") == 0)
      data.innerHTML = (parseFloat(data.innerHTML) + mod_value).toFixed(2);
    else
      data.innerHTML = (parseFloat(data.innerHTML) - mod_value).toFixed(2);

    ComputeLoss();
  });


  counter = 0;
  setInterval(GradientDescent, 1000);

 });
