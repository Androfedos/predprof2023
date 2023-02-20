var tm = 2000;
var g_data;
var table_view = false;


function updateAirTempChart()
{
    $.ajax({
        url: "/ajax/at/current",
        cache: false,
        dataType: 'json',
        success: function(data) {
          g_data = data['temperature'];
          drawWindow(data['state'], data["enabled"]);
          drawAirTempChart(g_data);
        },
        complete: function (jqXHR, textStatus) {
            setTimeout(function() {
              updateAirTempChart();
            }, tm)
        }
      });
}

function updateAirHumChart()
{
  //console.log("updateAirHumChart")
  $.ajax({
        url: "/ajax/ah/current",
        cache: false,
        dataType: 'json',
        success: function(data) {
          g_data = data["humidity"];
          drawWet(data['state'], data['enabled']);
          //console.log("sucess updateAirHumChart")
          drawAirHumChart(g_data)
        },
        complete: function (jqXHR, textStatus) {
            setTimeout(function() {
              updateAirHumChart();
            }, tm)
        }
      });
}

function updateSoilHumChart()
{
  $.ajax({
        url: "/ajax/sh/current",
        cache: false,
        dataType: 'json',
        success: function(data) {
          g_data = data["humidity"];
          drawSoilHumChart(g_data)
          for (i=0; i<6; i++)
            drawWaterButton(i+1, data["states"][i], data["enabled"][i])
        },
        complete: function (jqXHR, textStatus) {
            setTimeout(function() {
              updateSoilHumChart();
            }, tm)
        }
      });
}

function updateDinamicsAT(num)
{
    $.ajax({
        url: "/ajax/at/"+num.toString(),
        cache: false,
        dataType: 'json',
        success: function(data) {
          g_data = data
          var arr = [['Время', 'Температура']];
          var title = (num<=4) ? ("Динамика температуры воздуха датчика " + num.toString()): "Динамика средней температуры воздуха";
          drawDynChart(num, arr, title, data)
        },
        complete: function (jqXHR, textStatus) {
            setTimeout(function() {
              updateDinamicsAT(num);
            }, tm)
        }
    });
}

function updateDinamicsAH(num)
{
    $.ajax({
        url: "/ajax/ah/"+num.toString(),
        cache: false,
        dataType: 'json',
        success: function(data) {
          g_data = data
          var arr = [['Время', 'Влажность']];
          var title = (num<=4) ? ("Динамика влажности воздуха датчика " + num.toString()): "Динамика средней влажности воздуха";
          drawDynChart(num, arr, title, data)
        },
        complete: function (jqXHR, textStatus) {
            setTimeout(function() {
              updateDinamicsAH(num);
            }, tm)
        }
    });
}

function updateDinamicsSH(num)
{
    $.ajax({
        url: "/ajax/sh/"+num.toString(),
        cache: false,
        dataType: 'json',
        success: function(data) {
          g_data = data
          var arr = [['Время', 'Влажность']];
          var title = (num<=4) ? ("Динамика влажности почвы датчика " + num.toString()): "Динамика средней влажности почвы";
          drawDynChart(num, arr, title, data)
        },
        complete: function (jqXHR, textStatus) {
            setTimeout(function() {
              updateDinamicsSH(num);
            }, tm)
        }
    });
}

function drawAirHumChart(inp)   {
    if (table_view){
      var html = '<table class="tbl"><thead><tr><td>Датичик</td><td>Влажность</td></tr></thead><tbody>';
      for (var i = 0, len = inp.length; i < len; ++i) {
          html += '<tr>';
          if (i < 4) 
            html += '<td>' + (i+1) + '</td>'
          else
            html += '<td>Среднее</td>'
          html += '<td>' + inp[i] + '</td>'
          html += "</tr>";
      }
      html += '</tbody></table>';
      //$(html).appendTo('#ath_h_chart');
      $('#ath_h_chart').html(html);
    }
    else{
      var data = google.visualization.arrayToDataTable([
        ["Датчик", "Влажность", { role: "style" } ],
        ["Датчик 1", inp[0], "#6711FA"],
        ["Датчик 2", inp[1], "#6711FA"],
        ["Датчик 3", inp[2], "#6711FA"],
        ["Датчик 4", inp[3], "#6711FA"],
        ["Среднее",  inp[4], "green"],
      ]);

      var view = new google.visualization.DataView(data);
      view.setColumns([0, 1,
                        { calc: "stringify",
                          sourceColumn: 1,
                          type: "string",
                          role: "annotation" },
                        2]);

      var options = {
        title: "Текущая влажность воздуха",
        width: 800,
        height: 400,
        bar: {groupWidth: "75%"},
        legend: { position: "none" },
      };
      var chart = new google.visualization.ColumnChart(document.getElementById("ath_h_chart"));

      function selectHandler() {
          var selectedItem = chart.getSelection()[0];
          if (selectedItem) {
            window.location.href = "/dynamics_ah/"+(selectedItem.row+1);
          }
      }

      google.visualization.events.addListener(chart, 'select', selectHandler);     
      chart.draw(view, options);
  }
}
  
  function drawAirTempChart(inp){
    if (table_view){
      var html = '<table class="tbl"><thead><tr><td>Датичик</td><td>Температура</td></tr></thead><tbody>';
      for (var i = 0, len = inp.length; i < len; ++i) {
          html += '<tr>';
          if (i < 4) 
            html += '<td>' + (i+1) + '</td>'
          else
            html += '<td>Среднее</td>'
          html += '<td>' + inp[i] + '</td>'
          html += "</tr>";
      }
      html += '</tbody></table>';
      $('#ath_t_chart').html(html);
    }
    else{
    var data = google.visualization.arrayToDataTable([
      ["Датчик", "Температура", { role: "style" } ],
      ["Датчик 1", inp[0], "red"],
      ["Датчик 2", inp[1], "red"],
      ["Датчик 3", inp[2], "red"],
      ["Датчик 4", inp[3], "red"],
      ["Среднее",  inp[4] ,"green"],
    ]);

    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1,
                      { calc: "stringify",
                        sourceColumn: 1,
                        type: "string",
                        role: "annotation" },
                      2]);

    var options = {
      title: "Текущая температура воздуха",
      width: 800,
      height: 400,
      bar: {groupWidth: "75%"},
      legend: { position: "none" },
    };
    var chart = new google.visualization.ColumnChart(document.getElementById("ath_t_chart"));

    function selectHandler() {
      var selectedItem = chart.getSelection()[0];
      if (selectedItem) {
        window.location.href = "/dynamics_at/"+(selectedItem.row+1);
      }
    }

    google.visualization.events.addListener(chart, 'select', selectHandler);     
    chart.draw(view, options);
  }}

  function drawSoilHumChart(inp){
    if (table_view){
      var html = '<table class="tbl"><thead><tr><td>Датичик</td><td>Влажность</td></tr></thead><tbody>';
      for (var i = 0, len = inp.length; i < len; ++i) {
          html += '<tr>';
          if (i < 6) 
            html += '<td>' + (i+1) + '</td>'
          else
            html += '<td>Среднее</td>'
          html += '<td>' + inp[i] + '</td>'
          html += "</tr>";
      }
      html += '</tbody></table>';
      $('#sh_chart').html(html);
    }
    else{
    var data = google.visualization.arrayToDataTable([
      ["Датчик", "Влажность", { role: "style" }],
      ["Датчик 1", inp[0], "#6711FA"],
      ["Датчик 2", inp[1], "#6711FA"],
      ["Датчик 3", inp[2], "#6711FA"],
      ["Датчик 4", inp[3], "#6711FA"],
      ["Датчик 5", inp[4], "#6711FA"],
      ["Датчик 6", inp[5], "#6711FA"],
      ["Среднее",  inp[6], "green"],
    ]);

    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1,
                      { calc: "stringify",
                        sourceColumn: 1,
                        type: "string",
                        role: "annotation" },
                      2]);

    var options = {
      title: "Текущая влажность почвы",
      width: 1000,
      height: 400,
      bar: {groupWidth: "75%"},
      legend: { position: "none" },
    };
    var chart = new google.visualization.ColumnChart(document.getElementById("sh_chart"));
    
    function selectHandler() {  
      var selectedItem = chart.getSelection()[0];
      if (selectedItem) {
        window.location.href = "/dynamics_sh/"+(selectedItem.row+1);
      }
  }

    google.visualization.events.addListener(chart, 'select', selectHandler);     
    chart.draw(view, options);
}}

function drawDynChart(num, arr, title, inp)   {
    if (table_view){
      var html = '<table class="tbl"><thead><tr><td>'+arr[0][0]+'</td><td>'+arr[0][1]+'</td></tr></thead><tbody>';
      for (var i = 0, len = inp.length; i < len; ++i) {
          html += '<tr>';
          html += '<td>' + inp[i][0] + '</td>'
          html += '<td>' + inp[i][1] + '</td>'
          html += "</tr>";
      }
      html += '</tbody></table>';
      $('#chart').html(html);
    }  
    else {
      $.each(inp, function (index, value) {
          arr.push([value[0], value[1]]);
      });

      var data = google.visualization.arrayToDataTable(arr)

      var view = new google.visualization.DataView(data);
      view.setColumns([0, 1]);

      var options = {
        title: title,
        width: 800,
        height: 400,
        bar: {groupWidth: "75%"},
        legend: { position: "none" },
      };
      
      var chart = new google.visualization.ColumnChart(document.getElementById("chart"));
      chart.draw(view, options);
    }
}

function on_window_button(obj)
{
  $(obj).attr("disabled","disabled");
  $.ajax ({
    url: "/ajax/window_button",
    cache: false,
    dataType: 'json',
    success: function(data) {
        if (data["windows"]){
          $(obj).html('<img src="static/img/open_wnd.png" width="96" height="96"> Закрыть форточки');
        }
        else{
          $(obj).html('<img src="static/img/closed_wnd.png" width="96" height="96"> Открыть форточки');
        }
    },
      complete: function(){
        $(obj).removeAttr('disabled');
      }
    });
  
}

function loadWaterButtons(){
  $.ajax ({
    url: "/ajax/load_w_buttons/",
    cache: false,
    dataType: 'json',
    success: function(data) {
      for (let i = 1; i < 7; i++){
        drawWaterButton(i, data["swat" + i], false);
      }
    }
  })
}

function drawWaterButton(num, state, enabled){
  if (state){
    $("#water_button" + num).html('<img src="/static/img/water.png" width="64" height="64"> Полив включен');
  }   
  else{
    $("#water_button" + num).html('<img src="/static/img/nowater.png" width="64" height="64"> Полив выключен');
  }
  if (enabled)
    $("#water_button" + num).removeAttr('disabled');
  else
    $("#water_button" + num).attr("disabled","disabled");
}


function water_button(obj, num){
  $(obj).attr("disabled","disabled");
  $.ajax ({
    url: "/ajax/water_button/" + num,
    cache: false,
    dataType: 'json',
    success: function(data) {
      if (data["watering"]){
        $(obj).html('<img src="/static/img/water.png" width="64" height="64"> Полив включен');
      }
      else{
        $(obj).html('<img src="/static/img/nowater.png" width="64" height="64"> Полив выключен');
      }
    },
    complete: function(){
      $(obj).removeAttr('disabled');
    }
  })
}

function load_wnd(){
  $.ajax ({
    url: "/ajax/load_wnd/",
    cache: false,
    dataType: 'json',
    success: function(data){
      drawWindow(data["windows"], false)
    }
  })
}

function drawWindow(state, enabled){
  if (state){
    $("#window_button").html('<img src="static/img/open_wnd.png" width="96" height="96"> Закрыть форточки');
  }
  else{
    $("#window_button").html('<img src="static/img/closed_wnd.png" width="96" height="96"> Открыть форточки');
  }
  if (enabled)
    $("#window_button").removeAttr('disabled');
  else
    $("#window_button").attr("disabled","disabled");
}

function on_wetter_button(obj)
{
  $(obj).attr("disabled","disabled");
  $.ajax ({
    url: "/ajax/wetter_button/",
    cache: false,
    dataType: 'json',
    success: function(data) {
        if (data["wetter"]){
          $(obj).html('<img src="static/img/wet.png">Выключить увлажнитель');
        }
        else{
          $(obj).html('<img src="static/img/nowet.png">Включить увлажнитель');
        }
    },
      complete: function(){
        $(obj).removeAttr('disabled');
      }
    });
  
}

function load_wetter(obj){
  $.ajax ({
    url: "/ajax/load_wet/",
    cache: false,
    dataType: 'json',
    success: function(data){
      drawWet(data["wetter"], false);
    }
  })
}

function drawWet(state, enabled){
  if (state){
    $("#wetter").html('<img src="static/img/wet.png">Выключить увлажнитель');
  }
  else{
    $("#wetter").html('<img src="static/img/nowet.png">Включить увлажнитель');
  }
  if (enabled)
    $("#wetter").removeAttr('disabled');
  else
    $("#wetter").attr("disabled","disabled");
}