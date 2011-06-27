var MAX_SCREENS = 4;
var MAX_SCREEN_LINES = 10000;
var CLEANUP_INTERVAL = 10 * 1000; // 10 seconds
var RECONNECT_DELAY = 10 * 1000; // 10 seconds


// Event bindings, main method
$(document).ready(function() {
  var bottom_height = $(".stat:first").height();
  var bar_height = $(".bar:first").height();

  // Calculate individual screen size
  function calc_screen_size(scount) {
    if (!scount) { scount = $("#screens .screen").length; }
    var ssize = (($(window).height() - bottom_height - 20) / scount)
      - (bar_height + 53);
    return ssize;
  }

  $("#controls2, #right").height($(window).height());
  $(".console").height(calc_screen_size());
  var screen_width = $(window).width() - $("#controls2").width();
  $("#right, #bottom").width(screen_width).css('max-width', screen_width);

});
