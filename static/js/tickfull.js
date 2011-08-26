$(document).ready(function() {
        plot = window.tickp("#chart");
        plot.plotempty();

	var uuid = $('#chart').attr('alt');
	var urlstr = '/trend/?uuid=' + uuid;
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
		    plot.drawpoints();
		}
	    });
    });
