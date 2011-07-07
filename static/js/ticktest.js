$(document).ready(function() {
        plot = window.tickp("#chart");
        plot.plotempty();
	var ws = new WebSocket("ws://ec2-184-73-83-109.compute-1.amazonaws.com:80/ws/");


	// updates the gui stating that we have a new trend found
	ws.onmessage = function(event) {
	    var wsdata = event.data.split("|");
	    $(".websocket").prepend(wsdata[1]);
	    // have to rebind event after prepend
	    $("#"+wsdata[0]).click(gettrend);
	}

	var gettrend = function() {	
		var uuid = $(this).attr('id');
		var urlstr = '/trend/?uuid=' + uuid;
		$.ajax({
			url : urlstr, 
			    data : {},
			    dataType : 'json', 
			    type: 'GET', 
			    success: function(data) { 
			        $('.topchart').html(data['trend']['label']+' '+data['trendtype']);
			        var r = plot.read(data['trend']);
			        if(!r) { 
				  return;
			    } 
			    //plot.plot();

			    //plot.lines = data['lines'];
			    //plot.drawlines()
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
				//plot.plot();
				//plot.drawlines();
			}
		    });
	    });

	$('.trend').each(function() {
		var uuid = $(this).attr('id');
		$("#"+uuid).click(gettrend);
	    });

        //plot.getindicators();
    });
