$(document).ready(function() {
        plot = window.tickp("#chart");
        plot.plotempty();
	// production server
	var ws = new WebSocket("ws://ec2-174-129-255-230.compute-1.amazonaws.com:80/ws/");
	// dev server
	//var ws = new WebSocket("ws://ec2-184-73-24-67.compute-1.amazonaws.com:80/ws/");

	// updates the gui stating that we have a new trend found
	ws.onmessage = function(event) {
	    var wsdata = event.data.split("|");
	    $(".websocket").prepend(wsdata[1]);
	    // have to rebind event after prepend
	    $("#"+wsdata[0]).click(gettrend);
	}

	// ajax request for chart data for trend
	var gettrend = function(uuid) {
		$('input[type=radio]').attr('checked', false);
	        var uuid = $(this).attr('id');
		var urlstr = '/trend/?uuid=' + uuid;
		//plot.plotempty();
		plot.lines = null;
		plot.points = null;

		$.ajax({
			url : urlstr, 
			    data : {},
			    dataType : 'json', 
			    type: 'GET', 
			    success: function(data) { 
			        $('.topchart').html(data['chartdate']+' '+data['trend']['label']+' '+data['trendtype']);
			        var r = plot.read(data['trend']);
			        if(!r) { 
				  return;
			    } 

				plot.lines = data['lines'];
				plot.points = data['points'];
				plot.drawtrendlines();
			}
		    });
	}

	// ajax request for all market data for symbol
	// the links on the left
        $(".log_file").click(function(event) {
		var symbol = $('.label', this).html();
		var urlstr = '/feed/?symbol=' + symbol;
		$('input[type=radio]').attr('checked', false);
		$('input[type=radio]', this).attr('checked', true);
		//plot.plotempty();
		plot.lines = null;
		plot.points = null;
		$.ajax({
			url : urlstr, 
			    data : {},
			    dataType : 'json', 
			    type: 'GET', 
			    success: function(data) { 
			        $('.topchart').html(data['label']);
			        var r = plot.read(data);
			        if(!r) { 
				  return;
			    } 

			}
		    });
	    });

        $(".watchlabel").click(function(event) {
	        var uuid = $(this).parent().attr('id');
		$('input[type=radio]').attr('checked', false);
		$('.stream'+uuid).attr('checked', true);
		var urlstr = '/trend/?uuid=' + uuid;

		//plot.plotempty();
		plot.lines = null;
		plot.points = null;

		$.ajax({
			url : urlstr, 
			    data : {},
			    dataType : 'json', 
			    type: 'GET', 
			    success: function(data) { 
			        $('.topchart').html(data['chartdate']+' '+data['trend']['label']+' '+data['trendtype']);
			        var r = plot.read(data['trend']);
			        if(!r) { 
				  return;
			    } 

				plot.lines = data['lines'];
				plot.points = data['points'];
				plot.drawtrendlines();
			}
		    });
	    });

	$('.trend').each(function(event) {
 		var uuid = $(this).parent().attr('id');
		$("#trend"+uuid).click(gettrend);
	    });

        $(".remove_trend").click(function(event) {
		var uuid = $(this).parent().attr('id');
		$("#"+uuid).remove();
		var urlstr = '/removetrend/?uuid=' + uuid;
		$.ajax({
			url : urlstr, 
			    data : {},
			    dataType : 'json', 
			    type: 'GET', 
		    });
	    });

        $(".deletewatch").click(function(event) {
		var uuid = $(this).parent().attr('id');
		$("#"+uuid).remove();
		var urlstr = '/removewatchlist/?uuid=' + uuid;
		$.ajax({
			url : urlstr, 
			    data : {},
			    dataType : 'json', 
			    type: 'GET', 
		    });
	    });

        $(".addwatchlist").click(function(event) {
		var uuid = $(this).parent().attr('id');
		var urlstr = '/addwatchlist/?uuid=' + uuid;
		$(this).attr('src', '/static/images/cancel.png');
		$(this).attr('class', 'removewatchlist');
		$.ajax({
			url : urlstr, 
			    data : {},
			    dataType : 'json', 
			    type: 'GET', 
		    });
	    });

        $(".removewatchlist").click(function(event) {
		var uuid = $(this).parent().attr('id');
		var urlstr = '/removewatchlist/?uuid=' + uuid;
		$(this).attr('src', '/static/images/add.png');
		$(this).attr('class', 'addwatchlist');
		$.ajax({
			url : urlstr, 
			    data : {},
			    dataType : 'json', 
			    type: 'GET', 
		    });
	    });

	

    });
