/*
 * TickP : A library for plotting Stock Charts and Technical Analysis  
 * using html canvas 
 * 
 * Copyright (c) 2010 - Abhijit Gadgil <gabhijit@gmail.com>
 * 
 * Licensed under the MIT License 
 * http://www.opensource.org/licenses/mit-license.php
 *  
 * Includes some code from jQuery. 
 * 
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 * 
 * 
 */
(function($) {
    $.tickp = function(target, options) {
        /* constructor for the plot object. Idea taken from jQuery */
	divwidth = jQuery(window).width() - jQuery("#controls2").width();

        return new $.tickp.fn.init(target, options);
    };

    /* The plot object prototype */
    $.tickp.fn = {
        emas : {},
        psar: [],
        current : undefined,
        prev: undefined,

        /* The chart layout properties follow */ 
        /* first get the width */
        loffset : 3,
        rmargin : 40,
        plotwidth : 800,
        width : undefined, 
        /* tmargin and ttext row is the upper row. */
        tmargin:40, 
        ttextrow: 24, 
        topmargin : undefined,
        /* vspacing : spacing between main chart and lower indicators */
        vspacing: 3, 
        limargin: 0, 
        liplotht : 0, 
        loweriht : undefined,
        /* Margin at the bottom  */
        bmargin : 0,  
        plotht : 400, 
        height : undefined,

        interval : 0,
        /* chart mode: Supports two modes currently 
            - navigation (0): Displays values for individual candles and
                              simple trendline support. 
            - pan/zoom   (1): Moves along the time axis. TODO: Zoom mode 
        */
        mode: 1, // 0: navigation 1: pan and zoom 

        // supported indicators 
        supported : ['ema', 'sma', 'psar', 'bbands', 'rsi', 'stoch', 'macd'], 
        
        // our copyright text 
        copyrighttext : "\xA9 tickerplot.com",
        /* init is the constructor function for the object. 
            TODO: options support. Default options only right now. */  
        init: function(target, options) {
	    /* 
            * First thing we do is initialize target - 
            *  Assumption neigh requirement is 'target' is going to be the 
            *  'id' of the div where we are going to 'create canvas and shoot.
            */
	    this.plotwidth = (jQuery(window).width() - jQuery("#controls2").width())-100;
	    this.plotht = jQuery(".console").height()-30;

            this.target = $$(target);
            this.cs = $.tickp.csdark;

	    this.width = this.loffset + this.rmargin + this.plotwidth;

            // this.topmargin = this.tmargin + this.ttextrow,
	    // Don't need the top margin
            this.topmargin = 1,
            this.loweriht = this.vspacing + this.limargin + this.liplotht,

            this.height = this.topmargin + this.plotht + this.loweriht + this.bmargin;

            // drawing lines
            this.lines = [];
            this.undolines = [];

            this.infodiv = document.createElement('div')
            this.infodiv.id = 'info';
            this.infodiv.zIndex = "1000";
            this.target.appendChild(this.infodiv);

            // make ourselves available to the world as window.$plot (so that refering to us 
            // should not require to know the variable that held us 
            window.$plot = this;
            return this;
        },

	drawpoints: function() {
	    var points = this.points;

	    

	},

        drawtrendlines: function() {
            var lines = this.lines;
	    var points = this.points;

            var cs = this.cs;
            var cp = this.cp;
	    var overlays = {};
	    var indicators = [];
	    var shift = 0;
	    
	    var ob = this._window(this.current.ohlc, overlays, shift); 
            var xmin = ob.xmin, ymin = ob.ymin, xmax = ob.xmax, ymax = ob.ymax;

            var range = ymax - ymin;
            var scale = this.plotht/range; // scale: how much a unit takes on the plot

	    var _log = (cp.logscale ? Math.log : function(x) {return x});
            var csize = Math.round(cp.cwidth/1.6);

            var c = Math.round(cp.cwidth/2); // center of first (and every) candlestick

            var _top = this.topmargin, _left = this.loffset, _right = _left + this.plotwidth, _bottom = _top + this.plotht;
            var h = _bottom;

	    for (var i in lines) {
		// vertical = negative from top
		var y1 = Math.round((_log(lines[i][1])-cp.ymin)*scale);
		var y2 = Math.round((_log(lines[i][3])-cp.ymin)*scale);

		// horizontal = date
		// xlo finds left edge of candlestick
		var xlo1 = (c + (lines[i][0]-xmin)*cp.cwidth) - csize + this.loffset;
		// xline should find middle of candlestick
		var xline1 = xlo1 + Math.round(csize/2);

		var xlo2 = (c + (lines[i][2]-xmin)*cp.cwidth) - csize + this.loffset;
		var xline2 = xlo2 + Math.round(csize/2);

		angle = Math.atan2(y2-y1, xline1-xline2);

		//_drawline(this.ctx, xline1, h-y1, xline2, h-y2, '#fff', 2);
		_drawline(this.ctx, xline1, h-y1, xline2+1000*Math.cos(angle-Math.PI), (h-y2)+1000*Math.sin(angle-Math.PI), '#fff', 2);
	    }
	    for (var i in points) {
		var y1 = Math.round((_log(points[i][1])-cp.ymin)*scale);
		var y2 = Math.round((_log(points[i][3])-cp.ymin)*scale);

		// horizontal = date
		// xlo finds left edge of candlestick
		var xlo1 = (c + (points[i][0]-xmin)*cp.cwidth) - csize + this.loffset;
		var xlo2 = (c + (points[i][2]-xmin)*cp.cwidth) - csize + this.loffset;
		// xline should find middle of candlestick
		var xline1 = xlo1 + Math.round(csize/2);
		var xline2 = xlo2 + Math.round(csize/2);

		_drawarrow(this.ctx, xline2, h-y2, xline1, h-y1, '#fff', 2);
	    }
        },

        drawlines: function() {
            this.octx.clearRect(0,0, this.width, this.height);
            this.octx.strokeStyle = plot.cs.stroke;
            var lines = this.lines; 
            for(var i = 0; i < lines.length; i++) { 
                this.octx.beginPath();
                this.octx.moveTo(lines[i][0][0], lines[i][0][1]);
                this.octx.lineTo(lines[i][1][0], lines[i][1][1]);
                this.octx.stroke();
            } 
        },
 
        _initPlotCanvas: function() {
            // First determine the width and height. width won't change
            this.width = this.loffset + this.rmargin + this.plotwidth;

            //this.height = this.topmargin + this.plotht + this.loweriht + this.bmargin + (this.cp.numindicators * this.loweriht);
	    this.height = jQuery(".console").height();

            if(this.canvas) { 
                // A canvas already exists, we probably need to resize the
                // canvas
                this.canvas.height = this.height;
                this.canvas.width = this.width;
                this.overlay.height = this.height;
                this.overlay.width = this.width;
            } else { // first time call to us
                this.canvas = _getCanvas(this.width, this.height);
                if (!this.canvas) { 
                    throw "Cannot Initialize canvas";
                } 
                this.canvas.plot = this;
                this.target.appendChild(this.canvas);
            
                this.overlay = _getCanvas(this.width, this.height);
                if (!this.overlay) {
                    throw "Cannot Initialize overlay";
                } 
                this.overlay.style.position  = 'absolute';
                // FIXME: Check if the code below is correct 
                //this.overlay.style.left  = this._ElemPageOffsetX(this.canvas) + 'px';

                this.overlay.style.left  = '20px';
                this.overlay.style.top  =  this._ElemPageOffsetY(this.canvas) + 'px';
                this.overlay.plot = this;
                this.overlay.tabIndex = 0;
                this.target.appendChild(this.overlay);
                this.removeELs().addELs();
            } 
            // following we've to do everytime. 
            this.ctx = this.canvas.getContext("2d");
            this.ctx.fillStyle = this.cs.background;
            this.ctx.fillRect(0,0,this.width,this.height);
            this.octx = this.overlay.getContext("2d");

            return this;
        },

        // Functions for adding and deleting indicators. We do some of our own validations

        addindicator: function(type, params) {
            // We don't assume that client has validated params. It's better to validate again
            if (!validParams(type, params)) return false;
            var success = true;
            if(this.supported.indexOf(type) == -1) { 
                return false;
            }
            // max number of indicators we support .. 
            if (this.cp.numoverlays > 7) { 
                return false;
            } 
            // Some indicator specific checks go here . 
            switch(type) { 
            case 'ema': 
            case 'sma': 
                var period = parseInt(params[1]);
                var which = params[0];
                if(type == 'ema') { 
                    this.ema(this.current.ohlc, period, which);
                } else {
                    this.sma(this.current.ohlc, period, which);
                } 
                break;

            case 'psar':
                var af = parseFloat(params[0]);
                var maxaf = parseFloat(params[1]);
                if (maxaf < af) {
                    af = parseFloat(params[1]);
                    maxaf = parseFloat(params[0]);
                }
                if (maxaf > 0.5) { // user doesn't know what he's doing. We enforce! 'bad' but can't think of a better way..
                    // 0.5 is our upper limit for maxaf
                    maxaf = 0.5
                }
                this.psar(this.current.ohlc,af,maxaf);
                break;
            case 'bbands':
                var period = parseInt(params[0]);
                var mult = parseFloat(params[1]);

                if (mult > 2.0) { // user doesn't know what he's doing, we enforce for now. 
                    mult = 2.0;
                } 
                this.bbands(this.current.ohlc, period, mult);
                break;
            case 'macd': 
                var p1 = parseInt(params[0])
                var p2 = parseInt(params[1])
                var signal = parseInt(params[2])
        
                if(p1 > p2) { 
                    p1 = p2; 
                    p2 = parseInt(params[0]);
                }
                this.macd(this.current.ohlc, p1, p2, signal);
                break;
            case 'rsi':
                var lookback = parseInt(params[0]);
                this.rsi(this.current.ohlc, lookback);
                break;
            case 'stoch':
                var k = parseInt(params[0]);
                var x = parseInt(params[1]);
                var d = parseInt(params[2]);
                // FIXME : any validations? 
                this.stoch(this.current.ohlc, k, x, d);
            default: 
                break;
            } 
            if(success) {
                this.plot();
            } 
        },

        delindicator: function(which) { 

            if(which in this.current.overlays) {
                delete this.current.overlays[which];
                this.cp.numoverlays -= 1; 
                this.plot();
                return;
            }

            for(var j in this.current.indicators) { 
                if (which == this.current.indicators[j].str) { 
                    delete this.current.indicators[j];
                    this.cp.numindicators -= 1; 
                    this.plot();
                    return;
                } 
            } 
        },  
        
        // sends the list of current indicators to the caller. Used in UI to Delete any indicators if not wanted
        getindicators: function() {
            var ilist = [];
            if(!this.current) { 
                return ilist;
            } 
            for(var j in this.current.overlays) { 
                ilist.push(j);
            } 
            for(var j in this.current.indicators) { 
                ilist.push(this.current.indicators[j].str);
            } 
            return ilist;
        }, 
        // removes all the event listners on the overlay. 
        removeELs: function() {
            var o = this.overlay;
            
            //bruteforce... remove everything
            o.removeEventListener('mousedown', _beginTrendLine, false); 
            o.removeEventListener('mousemove', _drawTrendLine, false);
            o.removeEventListener('mouseup', _endTrendLine, false); 
            o.removeEventListener('keyup', _keyActions, false);
            o.removeEventListener('mousedown', _beginPanning, false); 
            o.removeEventListener('mousemove', _doPanning, false);
            o.removeEventListener('mouseup', _endPanning, false); 
            
            // returns self to the caller to allow chaining
            return this; 

        },

        addELs: function() { 
            if (!this.mode) { 
                this.overlay.addEventListener('mousedown', _beginTrendLine, false); 
                this.overlay.addEventListener('mousemove', _drawTrendLine, false);
                this.overlay.addEventListener('mouseup', _endTrendLine, false); 
            } else { // Pan mode 
                this.overlay.addEventListener('mousedown', _beginPanning, false); 
                this.overlay.addEventListener('mousemove', _doPanning, false);
                this.overlay.addEventListener('mouseup', _endPanning, false); 

            } 
           this.overlay.addEventListener('keyup', _keyActions, false);
            return this.overlay;

        },

        changemode: function(mode) { 
            mode = parseInt(mode);
            if (isNaN(mode)) { 
                return false;
            } 
            if(mode && mode != 1) { 
                return false;
            } 
            if(this.mode === mode) { 
                return false; // don't do anything if mode is same 
            }
            this.mode = mode;
            this.removeELs().addELs(); 
            this.lines = [], this.undolines = [];
            this.drawlines();
            this.plot();
        }, 
        plot: function() {
            /* 
             * first try to plot the data
             */
            this._initPlotCanvas();
            this._doplot(this.ctx, this.current);
            if (!this.mode) { 
                this.drawlines();
            } 
        },

        plotempty: function() { 
            this.cp = { numindicators : 0};
            this._initPlotCanvas();
            //this._drawText("Loading....", 100, 100, {font: '20pt Verdana'});
        
        }, 
        /* low level plot function. Should not be used directly. */
        /* Since this is a plotting function, we don't do any calculation 
            inside this function. We assume, all data is with us
            ctx : the context on which to plot.
            dataset : complete dataset - OHLC plus overlays plus lower 
                      indicators if any 
            shift : if present, specifies , shift relative to last plot, for
                    the first plot, makes no sense, used in pan mode. 
        */
        _doplot : function(ctx, dataset, shift) {

            var cs = this.cs;
            var cp = this.cp;

            var data = dataset.ohlc;
            var vol = dataset.vol;
            var overlays = dataset.overlays;
            var indicators =dataset.indicators;
            /* let's clear ourselves before we start plotting anything */
            this._clear(ctx);

            var ob = this._window(data, overlays, shift); 
            var xmin = ob.xmin, ymin = ob.ymin, xmax = ob.xmax, ymax = ob.ymax;

            // We get top, bottom, right, left of the plot and draw a bounding 
            // rectangle 
            var _top = this.topmargin, _left = this.loffset, _right = _left + this.plotwidth, _bottom = _top + this.plotht;
            ctx.strokeStyle = this.cs.stroke;
            ctx.strokeRect(_left, _top, this.plotwidth, this.plotht);
            var h = _bottom;

            // If the scale is log scale, we use, Math.log and Math.exp or else
            // we use identity function.
            // Max candles we'd be plotting would not be more than hundred or
            // so, hence calculating log and exp is not as expensive as it may
            // appear than doing it for entire data. 
            var _log = (cp.logscale ? Math.log : function(x) {return x});
            var _exp = (cp.logscale ? Math.exp : function(x) {return x}); 

            var c = Math.round(cp.cwidth/2); // center of first (and every) cdl 
            var csize = Math.round(cp.cwidth/1.6);

            // the following variables are needed for plotting volume.
            var vt = this.topmargin + this.plotht + this.vspacing;
            var vb = vt + this.liplotht + this.limargin;
            var vl = this.loffset;
            var vr = this.loffset + this.plotwidth;
            var vymax = _minmax1d(vol.slice(xmin,xmax))[1] * 1.1;
            var vymin = 0; 
            var vrange = vymax - vymin;
            var vscale = this.liplotht/vrange;
            var vh = vb;
            ctx.strokeStyle = this.cs.stroke;
            ctx.strokeRect(vl, vt, this.plotwidth, this.liplotht + this.limargin);

            var range = ymax - ymin;
            var scale = this.plotht/range; // scale: how much a unit takes on the plot
            var prevxy = []; // used for drawing line to last point

            for(var i = xmin; i < xmax; i++) { 
                var yop = Math.round((_log(data[i][0])-cp.ymin)*scale);
                var yhi = Math.round((_log(data[i][1])-cp.ymin)*scale);
                var ylo = Math.round((_log(data[i][2])-cp.ymin)*scale);
                var ycl = Math.round((_log(data[i][3])-cp.ymin)*scale);
                
                var xlo = (c + (i-xmin)*cp.cwidth) - csize + this.loffset;
                var xline = xlo + Math.round(csize/2);

                /* invert colors if Open > Close */
                // FIXME : Fix for Opera.. Doesn't like negative width/height
                // FIXME : check if it works
                if (yop > ycl) {
                    ctx.fillStyle = cs.rcandle;
                } else {
                    ctx.fillStyle = cs.gcandle;
                    var t = ycl; ycl = yop; yop = t; 
                }
                if(cp.type == 1) {  // candle-stick
                    ctx.fillRect( xlo, h-yop, csize, yop-ycl);
                    _drawline(ctx,xline, h-yhi, xline, h-ylo, ctx.fillStyle, 1);
                } else if( cp.type == 2) { // OHLC 
                    _drawline(ctx,xline, h-yhi, xline, h-ylo, ctx.fillStyle, 2);
                    _drawline(ctx, xlo, h-yop, xline, h-yop, ctx.fillStyle, 2);
                    _drawline(ctx, xline, h-ycl, xlo+csize, h-ycl, ctx.fillStyle, 2);
                } else {  
                    if ( i-xmin > 0) { /* skip first line */
                        _drawline(ctx,prevxy[0], prevxy[1], xline, h-ycl, cs.stroke, 3);
                    } 
                    prevxy = [xline, h-ycl];
                }
                /* try plotting the volume */ 
                if(vol[i]) { 
                    var yvol = vol[i] * vscale;
                    // FIXME : Fix for opera, check if it works 
                    ctx.fillRect( xlo, vh-yvol, csize, yvol);
                } 
    
            };

            /* plot any overlay indicators */
            var k = 0; 
            for (var o in overlays) {
                
                // TODO: evaluate, whether it makes sense to have separate 
                // functions for each of the overlays. Right now this looks ok. 
                var prevxy = [];
                var o1 = overlays[o].data;
                for(var j = xmin; j < xmax; j++) { 
                    var i = j  - xmin;
                    var ycl = Math.round((_log(o1[j])-ymin)*scale);
                    if (!o.search('psar')) { //overlay name begins with psar.. this is our 
                        var pwidth = Math.round(cp.minwidth/8);
                        var xlo = (c + i*cp.cwidth) - 2*pwidth + this.loffset;
                        ctx.fillStyle = cs.psar;
                        //FIXME: Fix for opera, check 
                        ctx.fillRect(xlo, h-ycl-2*pwidth, 2*pwidth, 2*pwidth);
                    } else if(!o.search('bbands')) { 
                        if (!o1[j][0]) { 
                            continue;
                        }
                        var xlo = (c + i*cp.cwidth) - csize + this.loffset;
                        var xline = xlo + Math.round(csize/2);
                        var bmax = Math.round((_log(o1[j][0])-ymin)*scale);
                        var bm = Math.round((_log(o1[j][1])-ymin)*scale);
                        var bmin = Math.round((_log(o1[j][2])-ymin)*scale);
                        if (i > 0 && prevxy[0]) { //skip first line
                            _drawline(ctx,prevxy[0][0], prevxy[0][1], xline, h-bmax, cs.bbands[0], 1);
                            _drawline(ctx,prevxy[1][0], prevxy[1][1], xline, h-bm, cs.bbands[1], 1);
                            _drawline(ctx,prevxy[2][0], prevxy[2][1], xline, h-bmin, cs.bbands[2], 1);
                        }
                        prevxy = [[xline, h - bmax], [xline, h - bm], [xline, h-bmin]];

                    } else {
                        overlays[o].offset = k;
                        if(!o1[j]) { 
                            continue;
                        } 
                        var xlo = (c + i*cp.cwidth) - csize + this.loffset;
                        var xline = xlo + Math.round(csize/2);
                        if (i>0 && prevxy[0]) { //skip first line
                            _drawline(ctx,prevxy[0], prevxy[1], xline, h-ycl, cs.overlays[k%cs.overlays.length], 1);
                        }
                        prevxy = [xline, h-ycl];
                    }
                } 
                k += 1;
            }

            /* and X and Y axis  FIXME:  get it right */ 
            var ystops = this._ygrid(_exp(ymin), _exp(ymax), 10);
            for(var i in ystops) {
                var logystp = _log(ystops[i]);
                var y1 = Math.round((logystp - cp.ymin)*scale);
                if( y1 > 20) { // don't draw anything in first 20 pixels  
                    _drawline(ctx, _left, h-y1, _right, h-y1, cs.stroke);
                    label = ystops[i];
                    this._drawText(label, _right, h - y1, {align:'left', padding:5});
                } 
            };
            
            var howmany = xmax-xmin;
            var xstop = Math.floor(howmany/cp.maxxlabels);
            h = h + (cp.numindicators+1)*this.loweriht;
            for(var i = xmin; i < xmax; i++) { 
                if(i%xstop == 0) {
                    var label = this._idxToDate(i);
                    var xlo = (c + (i-xmin)*cp.cwidth) - csize + this.loffset;
                    var xline = xlo + Math.round(csize/2);
                    if(xlo > this.loffset + 20) { 
                        _drawline(ctx, xline, h , xline, this.topmargin, cs.stroke);
                        ctx.fillStyle = cs.label;
                        ctx.textAlign = "center";
                        ctx.fillText(label,xlo,h + this.vspacing + 10); 
                    } 
                } 
            } 

            // Labels need to be added after the lines are drawn */
            k = 1;
            for(var j in indicators) {
                this._plotIndicator(indicators[j], k);
                k += 1;
            }

            /* And now let's give it a label. */
            if (this.cp.label) { 
                //this._drawText("VOLUME", vl, vt+20, {align:'left', padding:5, font:'10pt Verdana'});
                //this._drawText(this.cp.label, this.loffset - 2, 24, {align:'left', font:'16pt Verdana'});
                //this._drawText(this.copyrighttext, this.width - 60, 24, {align:'right', padding:5, font:'12pt Verdana'});
                var ol = this.cs.overlays;
                for (var i in overlays) {
                    if (overlays[i].offset !== undefined) {
                        var o = overlays[i].offset;
                        this._drawLegend(i, o);
                    } 
                } 
            }
        },

        _clear: function(ctx) { 
            ctx.clearRect(0,0, this.width, this.height);
            ctx.fillStyle = this.cs.background;
            ctx.fillRect(0,0,this.width,this.height);
        },  
        /* 
         * We assume the data is already downloaded using probably ajax or a local copy.  We just read this data in the TA object. If there are any known indicators in the template, we fire and store those in the TA object supported formats: json array, or JS array. Anything else, we don't process as of now Upon completion, done function is called - first parameter is 'TA object' second parameter is error code.  TODO : implement done function functionality completely.*/
        read: function(data, done) {
            // We expect the data to be in the following form 
            // { label : 'label for the chart', data: [[ts,o,h,l,c,v], [ts,o,h,l,c,v],....] } 

            //New chart param. We are not going to plot before read anyways.
            this.cp =  new $.tickp.chartparams.init(this);
            var errorcode = 0;
            var label = '';
            if (!data.label || !data.data) { 
                // see if it's an array.
                if (isArray(data)) { 
                    if(!(data.length)) { // empty array 
                        return false;
                    } 
                    var d = data;
                }
            } 
            if (data.data) {
                if (isArray(data.data)) { 
                    if(!data.data.length) { // empty array
                        return false;
                    } 
                    var d = data.data;
                }
                if (data.label) {
                    label = data.label;
                } 
            }  
            // neither data or data.data was an array, try to parse json or else give up 
            if(!d) {
                try { 
                    errorcode = 0;
                    var d = parseJSON(data);
                    if (d.data)  {
                        if (isArray(d.data)) {
                            label  = d.label;
                            d = d.data;
                        } else {
                            errorcode = -3;
                        } 
                    } else if (!isArray(d)) {
                        errorcode = -3;
                    }
                } catch (e) {
                    alert(e);  // FIXME: Is not portable. I guess alert is okay for portability
                    errorcode = -2; // JSON failure.
                }
            } 

            if (errorcode) {
                if (isFunction(done)) { // Data not good 
                    return false; // FIXME : revisit this later
                    return done.call(this, errorcode); 
                } else {
                    return false;
                }
            }
            /*  We Got Data now. We separate this into timestamps and OHLC
                The advantage of separating these two is that, later when we 
                need slices of the data, we'd use the timestamps to obtain 
                indices and then use those offsets in ohlc and indicators.
                it'd be efficient goin through the timestamps table */
            this.current = { ts: [], ohlc:[], vol:[], overlays:{}, indicators:[]};
            this.cp.numindicators = 0; // Canvas uses this value. Need to be reset
            this.cp.label = label; // FIXME: The data should take care of it 
            var ts = [];//this.current.ts; //just for convenience
            var ohlc = [];//this.current.ohlc; //just for convenience
            var v = []; // this.current.vol;
            if (!d) { 
                var d = data;
            }
            for(var i in d) {
                ts[i] = _getDateTs(d[i][0]);
                ohlc[i] = [d[i][1], d[i][2], d[i][3], d[i][4]];
                if(d[i][5]) { 
                    v[i] = d[i][5];
                }
            }
            
            this.dailydata = undefined;
            this.monthlydata = undefined;
            this.weeklydata = undefined;
            this.dailydata = {ts:ts, ohlc:ohlc, vol : v};
            if (this.interval == 1) { 
                this.timescale(ts, ohlc, v, 'weekly');
            }
            if (this.interval == 2) {  
                this.timescale(ts, ohlc, v, 'monthly');
            } 
            this.setTimeScale(this.interval);
            return true;
        },
        
        timescale : function(ts, data, volume, tmscale) { 
            var cwi = -1, lwi = -1;
            var wohlc = [], wts = [], v = [];
            var whi, wlo;

            var pwd = (tmscale == 'weekly' ? 7 : 32);
            for (var i = 0; i < data.length; i++) {
                var dt = data[i]; 
                var d = new Date(ts[i]);
                var wom = (tmscale == 'weekly' ? d.getDay(): d.getDate());
                if ( wom < pwd) { // new week has started 
                    cwi++; 
                    wohlc[cwi] = [dt[0], dt[1], dt[2], dt[3]]; 
                    wts[cwi] = ts[i]; 
                    v[cwi] = volume[i];
                    whi = dt[1];
                    wlo = dt[2]; 
                } else { 
                    if (dt[1] > whi) {
                        whi = dt[1]; 
                        wohlc[cwi][1] = whi;
                    } 
                    if (dt[2] < wlo) { 
                        wlo = dt[2]; 
                        wohlc[cwi][2] = wlo;
                    } 
                    wohlc[cwi][3] = dt[3];
                    v[cwi] += volume[i];
                } 
                pwd = wom; 
            }
            if (tmscale == 'weekly') { 
                this.weeklydata = { ts: wts, ohlc : wohlc, vol : v}; 
            } 
            if (tmscale == 'monthly') { 
                this.monthlydata = { ts: wts, ohlc: wohlc, vol : v};
            } 
        }, 
        
        setTimeScale : function(ts) {
            var ts = parseInt(ts); 
            if(isNaN(ts)) ts = 0; 
            this.interval = ts;
            if (!this.dailydata) return; // just in case. 
            switch(ts) { 
                case 0:
                    this.current.ohlc = this.dailydata.ohlc;
                    this.current.ts = this.dailydata.ts;
                    this.current.vol = this.dailydata.vol;
                    this.cp.end = this.dailydata.ohlc.length;
                    break;
                case 1:
                    
                    if(!this.weeklydata) {
                        this.timescale(this.dailydata.ts, this.dailydata.ohlc, this.dailydata.vol, 'weekly');
                    }
                    this.current.ohlc = this.weeklydata.ohlc;
                    this.current.ts = this.weeklydata.ts;
                    this.current.vol = this.weeklydata.vol;
                    this.cp.end = this.weeklydata.ohlc.length;
                    break;
                case 2:
                    if(!this.monthlydata) {
                        this.timescale(this.dailydata.ts, this.dailydata.ohlc, this.dailydata.vol, 'monthly');
                    }
                    this.current.ohlc = this.monthlydata.ohlc;
                    this.current.ts = this.monthlydata.ts;
                    this.current.vol = this.monthlydata.vol;
                    this.cp.end = this.monthlydata.ohlc.length;
                    break;
                default: 
                    this.current.ohlc = this.daily.ohlc;
                    this.current.ts = this.daily.ts;
                    this.current.vol = this.daily.vol;
                    break;
            }
            // We now delete all indicators and overlays.  
            // Remember : Always use delindicator to delete an indicator. It keeps the internal
            // plot structure consistent. 
            var all = this.getindicators();
            for(var i in all) { 
                this.delindicator(i);
            } 
            this.plot();
        }, 
                    
        /* zooming.. basically this is very simple . We change the cpminwidth 
            value and replot
        */
        zoom: function(up) { 
            if (up) { 
                this.cp.minwidth += 2;
                if (this.cp.minwidth > 40) {
                    this.cp.minwidth = 40;
                }
            } else { 
                this.cp.minwidth -= 2;
                if (this.cp.minwidth < 6) {
                    this.cp.minwidth = 6;
                }
            } 
            this.plot();
        },     
            

        /* The function below returns an array of values for Y axis for Grid
        Display. Basic algorithm is given below - 
        Figure out the closest separator value from the lookup 
        for given input and then return ceil of min to floor of max times the
        separator in an array. Those will be our grid points. 
        Loved, this piece of code. Not brilliant, but very clever, hopefully
        should scale from Penny stocks to Zimbabwe market */ 
        _ygrid: function(ymin, ymax, howmany) {
            var approx = (ymax - ymin)/howmany;
            lookup = [0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 25.0, 50.0, 
                 100.0, 250.0, 500.0, 1000.0, 2500.0, 5000.0, 
                 10000.0, 25000.0];

            var na = []
            for (i in lookup) {
                var b = lookup[i]/approx;
                if (b < 1.0) { b = 1/b; } 
                na.push(b);
            }
            var closest = lookup[na.indexOf(Math.min.apply(this,na))];
            var minindex = Math.ceil(ymin/closest); 
            var maxindex = Math.floor(ymax/closest);
            vals = [];
            for(var j = minindex; j <= maxindex; j++) { 
                vals.push(j*closest);
            }

            return vals;
        },

        /* when we plot we are not going to plot more than _window amount of 
           data. So we call this function before plotting. Or it might get
            automatically called depending upon date range being too long
            TODO: Implement date ranges. 
            This is the most important internal function in plotting. 
            This function, first determines the range of data that is to be
            plot. Then it figures out the chart specific parameters. Most 
            important being (xmin, xmax, ymin, ymax) and it returns these
            values to the caller. But this function just doesn't do that much
            it also - determines whether 'log' mode is required. 
            it also - initiates the values of the chartparams object (which
            the drawing function would later use.) 
         */
        _window : function(data, overlays, shift, datelo, datehi) {

            /* right now only intializes chart params using data.*/
            var cp = this.cp;

            var w = this.plotwidth;
            /* Determine howmany candles to display and get their begin and
                end offsets. */
            var begin, end, howmany = 0;

            shift = shift || 0; 
            cp.candles = cp.candles || data.length;
            howmany = data.length;
            if(howmany > (w/cp.minwidth)) {
                howmany = Math.round(w/cp.minwidth);
            } 

            cp.end = cp.end || data.length; // first time we set it to end
            cp.end -= shift;
            if (cp.end > data.length) {
                cp.end = data.length;
            }
            cp.begin = cp.end - howmany; 
            if (cp.begin < 0) {
                cp.begin = 0;
                cp.end = cp.begin + howmany;
            }
            begin = cp.begin;
            end = cp.end;

            // -- nasty code begins : Note above code substantially simpliefies it,
            //    still, I'd keep this for some time and get rid of it, once I am convinced
            /* if (!(shift === undefined)) {
                if(cp.candles == data.length) { // no panning is required

                    return { xmin:cp.begin, xmax: cp.end, ymin:cp.ymin, ymax:cp.ymax};
                } else { 
                    howmany = cp.candles;
                } 
                begin = cp.begin - shift;
                if (begin < 0) {
                    begin = 0; 
                } 
            } else {
                howmany = data.length;

                if(howmany > ((w)/cp.minwidth)) {
                    howmany = Math.round(w/cp.minwidth);
                } 
                begin = data.length - howmany;
            } 
            end = begin + howmany;
            if (end > data.length) { 
                end = data.length;
                begin = end - howmany;
            }  */ 

            // -- nasty code ends 

            /* Stuff needed to determine width of candles */
            cp.candles = howmany;
            cp.cwidth = Math.floor((w)/cp.candles);
            if (cp.cwidth > 40) {
                cp.cwidth = 40;
            } 

            /* Y range is going to be dynamic get, min and max from data */
            var max, min;
            var d_ = _minmax2d(data.slice(begin, end));
            min = d_[0], max = d_[1];
    
            /* Indicators overlayed should fit in the frame. So determine the 
               real 'min/max' by using the overlays data as well.  */
            if (overlays) { 
                for( var j in overlays) { 
                    var omax, omin;
                    if (!j.search('bbands')) {
                        d_ = _minmax2d(overlays[j].data.slice(begin, begin+howmany));
                    } else { 
                        d_ = _minmax1d(overlays[j].data.slice(begin, begin+howmany));
                    } 
                    omin = d_[0], omax = d_[1];
                    if (omax > max) max = omax;
                    if (omin < min) min = omin;
                } 
            } 

            cp.begin = begin;
            cp.end = end; 
            if ((max/min > 2.0) && cp.autoscale) {
                cp.logscale = true;
            }
            var range = max - min; 
            cp.ymin = min - (0.05*range); // little margin below
            cp.ymax = max + (0.05*range); // little margin above 

            if(cp.logscale) { 
                min = 0.9 * min; 
                max = 1.1 * max; 
                cp.ymin = Math.log(min);
                if(isNaN(cp.ymin)) { 
                    /* bollingers might go negative n stock split, for which Math.log is not defined. 
                       we set the min to 0 for now */ 
                    cp.ymin = 0;
                } 
                cp.ymax = Math.log(max);
            }
            return { xmin:begin, xmax: end, ymin:cp.ymin, ymax:cp.ymax};
        },

        _idxToDate: function(i) { 
            var ts = this.current.ts[i];
            return _tsToDate(ts);
        },

        _plotIndicator : function(i, o) {
            var data = i.data;
            var type = i.type;     
            var str = i.str;
            var t = this.topmargin + this.plotht + (o*this.loweriht) + this.vspacing;
            var b = t + this.liplotht + this.limargin;
            var l = this.loffset;
            var r = this.loffset + this.plotwidth;
            var begin = this.cp.begin;
            var end = this.cp.end;
            
            var cp = this.cp;
            var cs = this.cs;
            
            ctx = this.ctx;

            var c = Math.round(cp.cwidth/2); // center of first (and every) cdl 
            var csize = Math.round(cp.cwidth/1.6);
            switch(type) { 
            case 'macd':
                var d = _minmax2d(data.slice(begin,end));
                var ymax = d[1], ymin = d[0];
                var range = (ymax - ymin);
                ymax = ymax + 0.1 * range;
                ymin = ymin - 0.1 * range;
                range  = ymax - ymin ; 
                var scale = this.liplotht / range;
                var h = b; 
                prevxy = [];
                ctx.strokeStyle = this.cs.stroke;
                ctx.strokeRect(l, t, this.plotwidth, this.liplotht + this.limargin);
                for(var j = begin; j < end; j++) { 
                    if(data[j][0] === undefined ) {
                        continue;
                    }
                    var i = j - begin; 
                    var xlo = (c + i*cp.cwidth) - csize + this.loffset;
                    var xline = xlo + Math.round(csize/2);
                    var mhi = Math.round((data[j][0]-ymin)*scale);
                    var mlo = Math.round((data[j][1]-ymin)*scale);
                    var mzero = Math.round((0 - ymin)*scale);
                    if (prevxy[0]) { //skip first line
                        _drawline(ctx,prevxy[0][0], prevxy[0][1], xline, h-mhi, cs.macd[0], 1);
                        _drawline(ctx,prevxy[1][0], prevxy[1][1], xline, h-mlo, cs.macd[1], 1);
                        ctx.fillStyle = cs.stroke;
                        // FIXME : Fix for opera, check if it works
                        if(mhi-mlo > 0) {
                            ctx.fillRect(xlo, h-mzero-(mhi-mlo), csize, (mhi-mlo)); 
                        } else { 
                            ctx.fillRect(xlo, h-mzero, csize, (mlo-mhi)); 
                        } 
                    }
                    prevxy = [[xline, h - mhi], [xline, h - mlo]];
                } 
                break;
            case 'rsi': 
                ymax = 100;
                ymin = 0;
                range  = ymax - ymin ; 
                var scale = this.liplotht / range;
                var h = b; 
                prevxy = [];
                ctx.strokeStyle = this.cs.stroke;
                ctx.strokeRect(l, t, this.plotwidth, this.liplotht + this.limargin);
                for(var j = begin; j < end; j++) { 
                    if(!data[j]) {
                        continue;
                    }
                    var i = j - begin; 
                    var xlo = (c + i*cp.cwidth) - csize + this.loffset;
                    var xline = xlo + Math.round(csize/2);
                    var rsi = Math.round((data[j]-ymin)*scale);
                    if (prevxy[0]) { //skip first line
                        _drawline(ctx,prevxy[0], prevxy[1], xline, h-rsi, cs.macd[0], 1);
                    }
                    prevxy = [xline, h - rsi];
                } 
                ystops = [30, 50, 70];
                for( var j in ystops) { 
                    var ystop = Math.round((ystops[j]-ymin)*scale);
                    _drawline(ctx, this.loffset, h - ystop, this.loffset+this.plotwidth, h - ystop, cs.stroke, 1);
                    label = ystops[j];
                    this._drawText(label, r, h - ystop, {align:'left', padding:5});
                }
                break;
            case 'stoch': 
                ymax = 100;
                ymin = 0;
                range  = ymax - ymin ; 
                var scale = this.liplotht / range;
                var h = b; 
                prevxy = [];
                ctx.strokeStyle = this.cs.stroke;
                ctx.strokeRect(l, t, this.plotwidth, this.liplotht + this.limargin);
                for(var j = begin; j < end; j++) { 
                    if(data[j][0] === undefined ) {
                        continue;
                    }
                    var i = j - begin; 
                    var xlo = (c + i*cp.cwidth) - csize + this.loffset;
                    var xline = xlo + Math.round(csize/2);
                    var mhi = Math.round((data[j][0]-ymin)*scale);
                    var mlo = Math.round((data[j][1]-ymin)*scale);
                    var mzero = Math.round((0 - ymin)*scale);
                    if (prevxy[0]) { //skip first line
                        _drawline(ctx,prevxy[0][0], prevxy[0][1], xline, h-mhi, cs.macd[0], 1);
                        _drawline(ctx,prevxy[1][0], prevxy[1][1], xline, h-mlo, cs.macd[1], 1);
                    }
                    prevxy = [[xline, h - mhi], [xline, h - mlo]];
                } 
                ystops = [20, 50, 80];
                for( var j in ystops) { 
                    var ystop = Math.round((ystops[j]-ymin)*scale);
                    _drawline(ctx, this.loffset, h - ystop, this.loffset+this.plotwidth, h - ystop, cs.stroke, 1);
                    label = ystops[j];
                    this._drawText(label, r, h - ystop, {align:'left', padding:5});
                }
                break;
            default:
                break;
            }
            this._drawText(str, l, t+20, {align:'left', padding:5, font:'10pt Verdana'});
            
        },

        /* Bells and whistles functions : Gives you candles from X, Y 
            co-ordinate, if the mouse is in the area of a candle, candle
            is returned or else nothing. This is used by _showInfo to 
            display OHLC data. 
        */
        _getCandle : function(x,y) { 
            x = x - this.loffset;
            y = y - this.topmargin;
            var cp = this.cp;
                
            var pc = this.plotwidth/(cp.end - cp.begin);
            var xos = Math.round(x/pc) + cp.begin;
            if ((xos < cp.end) && (xos >= cp.begin)) { 
                var candle = this.current.ohlc[xos];
                var chi = candle[1];
                var clo = candle[2];
                pc = this.plotht / (cp.ymax - cp.ymin); 
                var yos = cp.ymax - Math.round(y/pc);
                if((chi > yos) && (clo < yos)) {
                   return xos;
                }
            }
            return null;
        },

        _showInfo : function(o, x, y) {
            var data = this.current.ohlc;
            var s = this.infodiv.style;
        /*    s.background = '#FFFFCC';  
            s.display = 'block'; 
            s.position = 'absolute';
            s.border = '2px solid #0066CC';
            s.width = '100px';
            s.height = '200px';*/
            s.cssText = this.cs.idcss;
            s.left = (x -100 -5) + 'px';
            s.top = (y - 100-5) + 'px'; 
            html = '<table>';
            html += "<tr> <td>O</td><td>" + data[o][0] + "</td></tr>";
            html += "<tr> <td>H</td><td>" + data[o][1] + "</td></tr>";
            html += "<tr> <td>L</td><td>" + data[o][2] + "</td></tr>";
            html += "<tr> <td>C</td><td>" + data[o][3] + "</td></tr>";
            html += "</td>";
            this.infodiv.innerHTML = html;
        },

        /* given PageX, PageY, find the offset on the canvas. This is of 
            importance to us to determine the candles later on
         *  FIXME : I think we can get rid of _canvasXXXX functions once the ElemPageOffsetXXX functions are there. That's for  first review. 
        */
        _canvasOffsetX: function(x, c) { 
            var ox = 0; 
            do { 
                ox += c.offsetLeft;
            }while (c = c.offsetParent) ; // from quirksmode 
            return  x-ox;
        }, 

        _canvasOffsetY: function(y,c) { 
            var oy = 0; 
            do { 
                oy += c.offsetTop;
            } while (c = c.offsetParent) ; // from quirksmode 
            return y-oy;
        }, 

        // Fixme, one can move these out of the object
        _ElemPageOffsetX: function(e) { 
            var ox = 0; 
            do { 
                ox += e.offsetLeft;
            } while (e = e.offsetParent) ; // from quirksmode 
            return ox;
        }, 

        _ElemPageOffsetY: function(e) { 
            var oy = 0; 
            do { 
                oy += e.offsetTop;
            } while (e = e.offsetParent) ; // from quirksmode 
            return oy;
        }, 

        /* Text handling util functions */

        _drawText: function(txt, x, y, style) {
            var cs = this.cs;
            var ctx = this.ctx;
            var color = style.color || cs.label;    
            var font = style.font || '10pt Verdana bold';
            var padding = style.padding || 2;
            var align = style.align || 'start';

            ctx.font = font;
            ctx.textAlign = align;
            var l = x + 2*padding + ctx.measureText(txt).width;
            ctx.fillStyle = this.cs.background;
            //FIXME : Fix for opera, check if it works 
            ctx.fillRect(x+padding-1,y-15, l, 15);
            ctx.fillStyle = color;
            ctx.fillText(txt, x+padding, y);

            return l;
        }, 
            

        _drawLegend: function(label, offset) { 
            var y = 16 + this.tmargin;
            var x = offset*100 + this.loffset;
            var color = this.cs.overlays[offset%this.cs.overlays.length];
            this._drawText(label, x, y, {padding:0, color:color});

        }, 

        _olexists: function(prop) {
            return (prop in this.current.overlays);
        }, 
        /* 
            TA functions: will be called in one of the following ways
              1. explicitely. (eg. Someone through UI ads an indicator) 
              2. Upon loading the original data, some indicators may be part of 
                 'default' template. So the functions below get called.
         */

        /* 
         * ema: is a TA-API, and _ema is an internal API, some other indicators 
                like macd, use this. so it's better to keep them separate 
         */
        ema: function(data, period, which) {
            which = which || 'close'; 
            var prop = 'ema' + period + which;
            
            if(this._olexists(prop)) {
                return;
            } 
            var o;
            switch(which) {
                case 'close':
                    o = 3;
                    break;
                case 'high': 
                    o = 1;
                    break;
                case 'low': 
                    o = 2; 
                    break;
                default:
                    o = 3;
            }
            var d = [];
            for(var i = 0; i < data.length; d.push(data[i++][o]));
            var e = this._ema(d, period, which); 
            this.current.overlays[prop] = {data: e, offset:this.cs.oloffset};
            this.cs.oloffset += 1;
            this.cp.numoverlays += 1;

            return this;

        }, 
        _ema: function(data, period, which) {
            var e_ = [];
            var mult = 2.0/(period+1);

            e_[0] = data[0];
            // We should be able to handle sparse data. Also, data
            // that is undefined or null at the beginning
            for(var i = 1; i < data.length; i++) {
                if (data[i] === undefined || data[i] === null ) {
                    e_[i] = e_[i-1];
                    continue;
                } 
                if(e_[i-1]) { 
                    e_[i] = (data[i]*mult) + (1 - mult) * e_[i-1];
                } else {
                    e_[i] = data[i];
                } 
            }
            return e_;
        },

        /* simple moving average : really simple */
        sma: function(data, period, which) {
            which = which || 'close';
            var o;
            switch(which) {
                case 'close':
                    o = 3;
                    break;
                case 'high':
                    o = 1;
                    break;
                case 'low' :
                    o = 2;
                    break;
                default:
                    o = 3;
            }
            var prop = 'sma' + period + which;
            if(this._olexists(prop)) {
                return;
            } 
            var s_ = [];
            var _sum = 0;
            period = period - 1;
            for(i = 0; i < data.length; i++) { 
                if(i < period) { 
                    s_[i] = undefined;
                    continue;
                }
                var t = data.slice(i-period, i+1);
                _sum = 0; 
                for( j in t) { 
                    _sum += t[j][o];

                };
                s_[i] = _sum/(period+1);
            }
            this.current.overlays[prop] = {data:s_, offset: this.cs.oloffset};
            this.cs.oloffset++;
            this.cp.numoverlays +=1 ;
            return this;    
        },

        /* parabolic SAR */ 
        psar: function(data, af, maxaf) {
            var i = 0, UP = 1, DOWN = 2;
            var currtrend = UP;
            var curraf = af;
            var updated = false;
            var d;
            var trendmin, trendmax;
            var prop = 'psar' + af + '-' + maxaf;

            if (this._olexists(prop)) {
                return;
            } 
            var p_ = [];
            for (i in data) {
                d = data[i];
                j = parseInt(i);
                if (i == 0) {
                    p_[j+1] = d[2]; p_[j] = d[2];
                    trendmin = d[2];
                    trendmax = d[1];
                    continue;
                }
                if (currtrend == UP) { 
                    if(d[1] > trendmax) { 
                        trendmax = d[1];
                        p_[j+1] = p_[j] + curraf*(trendmax - p_[j]);
                        curraf = curraf + af;
                        updated = true;
                    }
                    if (d[2] < p_[j]) { 
                        p_[j] = trendmax;
                        p_[j+1] = trendmax;
                        curraf = af; 
                        currtrend = DOWN;
                        trendmin = d[2];
                        trendmax = d[1];
                        updated = true;
                    } 
                } 
                if (currtrend == DOWN) { 
                    if(d[2] < trendmin) { 
                        trendmin = d[2];
                        p_[j+1] = p_[j] + curraf*(trendmin - p_[j]); 
                        curraf = curraf + af;
                        updated = true;
                    }
                    if (d[1] > p_[j]) { 
                        p_[j] = trendmin;
                        p_[j+1] = trendmin;
                        curraf = af; 
                        currtrend = UP;
                        trendmin = d[2];
                        trendmax = d[1];
                        updated = true;
                    } 
                } 
                if (! updated) { 
                    if(currtrend == UP) 
                        p_[j+1] = p_[j] + curraf*(trendmax - p_[j]); 
                    else 
                        p_[j+1] = p_[j] + curraf*(trendmin - p_[j]); 
                } 
                updated = false;
                if (curraf > maxaf) {curraf = maxaf;}
            }
            this.current.overlays[prop] = {data: p_ };
            this.cp.numoverlays +=1 ;
            return this;
        },

        bbands: function(data,period, mult) {  

            var b_ = []; 
            var prop = 'bbands' + period  + '-' + mult;

            if (this._olexists(prop)) { 
                return;
            } 
            period = period - 1; 
            for (var i = 0; i < data.length; i++) { 
                if( i < period) { 
                    b_[i] = [undefined, undefined, undefined];
                    continue;
                } 
                var t = data.slice(i-period, i+1); 
                var tc = [];
                var _s = 0;
                for (j in t) { 
                    _s = _s + t[j][3];
                    tc.push(t[j][3]);
                } 
                var sigma = stats.pstdev(tc);
                var mu = _s/(period+1);
                b_[i] = [ (mu +  mult*sigma), mu, (mu - mult * sigma)];
            }
            this.current.overlays[prop] = { data: b_ };
            this.cp.numoverlays += 1;
            return this;
        },

        /* p1 : is a faster Moving average (numerically lower) 
           p2 : is a slower Moving average (numerically higher)
           signal : is ema signal of p1 - p2 
        */
        macd: function(data, p1, p2, signal) {
            var istr = 'MACD(' + p1 + ', ' + p2 + ', ' + signal + ')';
            for(var i in this.current.indicators) { 
                if (this.current.indicators[i].str == istr)
                    return;
            } 
            var d = [];
            for(var i = 0; i < data.length; d.push(data[i++][3]));
            var ep1 = this._ema(d, p1);   
            var ep2 = this._ema(d, p2);   
            for(var i = 0; i < ep1.length; i++) { 
                ep1[i] = ep1[i] - ep2[i];
            } 
            ep2 = this._ema(ep1, signal);
            var m_ = [];
            for(i = 0; i < ep1.length; i++) { 
                m_[i] = [ep1[i], ep2[i], (ep1[i] - ep2[i])]; 
            }
            var i = {type : 'macd', data:m_, str: istr};
            this.current.indicators.push(i);
            this.cp.numindicators += 1;
            return this;
        },

        rsi: function(data, lookback) {
            var up = 0, down = 0;
            var rs; 
    
            var istr = 'RSI(' +  lookback + ')';
            for(var i in this.current.indicators) { 
                if (this.current.indicators[i].str == istr)
                    return;
            } 

            var rsi = [undefined]; // empty array plus initialization for 0.
            var prev = data[0][3];
            if (lookback > data.length) lookback = data.length;
            for(var i = 1; i < lookback; i++) { 
                var diff = data[i][3] - prev;
                if (diff > 0 ) { 
                    up = up + diff;
                } else { 
                    down = down - diff;
                } 
                rsi.push(undefined);
                prev = data[i][3];
            }
            up /= lookback;
            down /= lookback;
            rs = up/down;
            for (var i = lookback; i < data.length; i++) { 
                var diff = data[i][3] - prev;
                rsi[i] = 100 - 100/(1+rs); 
                if(diff >= 0) {
                    up = (up*(lookback-1)+diff)/lookback;
                    down = down*(lookback-1)/lookback;
                } else { 
                    down = (down*(lookback-1)-diff)/lookback;
                    up = up*(lookback-1)/lookback;
                }; 
                rs = up/down;
                prev = data[i][3];
            }

            var i = {type : 'rsi', data:rsi, str: istr} 
            this.current.indicators.push(i);
            this.cp.numindicators += 1;
        },

        stoch: function(data, k, x, d) { 
            var min, max, pk, d_;
            var istr = 'STOCH( ' + k + ', ' + x + ', ' + d + ')';
            for(var i in this.current.indicators) { 
                if (this.current.indicators[i].str == istr)
                    return;
            } 
            k = k -1 ;
            pk = [];
            for(i = 0; i < k; pk[i++] = undefined); 
            for(var i = k; i < data.length; i++) { 
                d_ = _minmax2d(data.slice(i-k, i+1));
                min = d_[0]; max = d_[1];

                pk[i] = (data[i][3] - min)/(max - min) * 100;
            }
            var pk_ = this._ema(pk,x);
            var pd_ = this._ema(pk_,x);

            for(i = 0;i < data.length; i++) { 
                pk_[i] = [pk_[i] , pd_[i]];
            }
            var i = {type : 'stoch', data:pk_, str: istr};
            this.current.indicators.push(i);
            this.cp.numindicators += 1;
        }

    };
    /* below is needed to give the object all the methods reqd. */
    $.tickp.fn.init.prototype = $.tickp.fn;

    /* the chartparams object. Used by several plot routines to findout current
        chart settings. Used for plotting */
    $.tickp.chartparams  = {
        init: function(plot) {
            this.plot = plot; // have a ref back to plot 
            return this;
        },  
        logscale: false,
        autoscale: false,
        type: 1, // 1: candlestick, 2: ohlc, 3: linecharts 
        w: undefined,
        h: undefined,
        candles : undefined,
        cwidth:undefined, 
        csize:undefined,
        ymin:undefined,
        ymax:undefined,
        numoverlays:0, // number of overlays.
        numindicators:0, // number of overlays.
        maxylabels: 10,
        maxxlabels: 10,
        minwidth: 8 //minimum width of a candle
    
    };
    /* assigning prototype */
    $.tickp.chartparams.init.prototype = $.tickp.chartparams;

    $.tickp.csdark = {
        background : '#000000', 
        label: '#EEEEEE',
        stroke: '#AAAAAA',
        gridlines: '#AAAAAA',
        overlays : ['#CB2BC6','#5217DB','#18E197', '#DED71F','#DE521F', '#10F5B8', '#A6ACE2', '#DF9FB0'], //['#FF6600', '#FFFF33', '#FFFF33', '#00CCFF', '#3366FF'],
        bbands: ['#aabbcc', '#aabbcc', '#aabbcc'],
        macd: ['#0000FF', '#FF0000', '#aabbcc'],
        psar: '#CCFFFF', 
        rcandle: '#FF0000',
        gcandle: '#00FF00',
        lineplot: '#CCCCCC',
        idcss: 'position:absolute; border: 2px solid #0066CC; background: #FFFFCC;font-size:10px;font-family:verdana;text-align:center;width:80px;height:100px; padding:2px;', 
        oloffset : 0

    };

    $.tickp.cslight = {
        background : '#FBFBFB', 
        label: '#080808',
        stroke: '#0B0B0B',
        gridlines: '#111111',
        overlays : ['#CB2BC6','#5217DB','#18E197', '#DED71F','#DE521F', '#10F5B8', '#A6ACE2', '#DF9FB0'], //['#FF6600', '#FFFF33', '#FFFF33', '#00CCFF', '#3366FF'],
        //overlays : ['#50124E','#250966','#075237','#3F3D08', '#3F1607', '#05523E', '#3F4158','#583F45'], //['#663300', '#FFCC00', '#000066', '#00CCFF', '#3366FF'],
        bbands: ['#001122', '#001122', '#001122'],
        macd: ['#000088', '#880000', '#aabbcc'],
        psar: '#000099', 
        rcandle: '#880000',
        gcandle: '#008800',
        lineplot: '#333333',
        idcss: 'position:absolute; border: 2px solid #0066CC; background: #FFFFCC;font-size:10px;font-family:verdana;text-align:center;width:80px;height:100px; padding:2px;',
        oloffset : 0
    };

    /* util functions */
    /* Get the canvas for us. */ 
    function  _getCanvas(w, h) {
        c = document.createElement('canvas');
        c.id = Math.round(Math.random()*100);
        c.width = w;
        c.height = h;
        return c; 
    };
    function _minmax2d(data) {
        var max = -Infinity;
        var min = Infinity;
        
        for(var i in data) {
            for (j in data[i]) {
                if (data[i][j] >= max)  max = data[i][j];
                if (data[i][j] < min) min = data[i][j]; 
            }
        }
        return [min, max];
    };

    function _minmax1d(data) { 
        var max = -Infinity;
        var min = Infinity;
        
        for(var i in data) {
           if (data[i] >= max)  max = data[i];
           if (data[i] < min) min = data[i]; 
        }
        return [min, max];
    };

    function _drawarrow(ctx, fromx, fromy, tox, toy, color, width) {
        color = color || "#111111";
        var width = width || 1.0;

	var headlen = 10;
	var angle = Math.atan2(toy-fromy, tox-fromx);
	ctx.moveTo(fromx, fromy);
	ctx.lineTo(tox, toy);
	ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/6), toy-headlen*Math.sin(angle-Math.PI/6));
	ctx.moveTo(tox, toy);
	ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/6), toy-headlen*Math.sin(angle+Math.PI/6));
	ctx.stroke();
	ctx.closePath();
    };

    function _drawline(ctx, x1, y1, x2, y2, color, width) {
        color = color || "#111111";
        var width = width || 1.0;

        var w = ctx.lineWidth;
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.stroke();
        ctx.closePath();
        ctx.lineWidth = w;
            
    };

    /* event handlers in the default 'trendline' mode */
    var _beginTrendLine = function(event) { 
        var ctx = this.plot.octx;
        ctx.begin_x = event.pageX - this.plot._ElemPageOffsetX(this);
        ctx.begin_y = event.pageY - this.plot._ElemPageOffsetY(this);
        ctx.start = true;
    };

    var _drawTrendLine = function(event) { 
        ctx = this.plot.octx;
        var myx = event.pageX - this.plot._ElemPageOffsetX(this);
        var myy = event.pageY - this.plot._ElemPageOffsetY(this);
        if (ctx.start) { 
            this.plot.drawlines();
            ctx.beginPath();
            ctx.strokeStyle = plot.cs.stroke;
            ctx.lineWidth = 1;
            ctx.moveTo(ctx.begin_x, ctx.begin_y);
            ctx.lineTo(myx, myy);
            ctx.stroke();
            ctx.closePath();
        } else { 
            var cdl = this.plot._getCandle(myx, myy);
            if (cdl) { 
                this.plot._showInfo(cdl, event.pageX, event.pageY);
            } else { 
                this.plot.infodiv.style.display = 'none'; 
            }
        } 
    };

    function _endTrendLine(event) { 
        ctx = this.plot.octx;
        ctx.start = false;
        // completed one line 
        var bx = ctx.begin_x;
        var by = ctx.begin_y;
        var ex = this.plot._canvasOffsetX(event.pageX, this);
        var ey = this.plot._canvasOffsetY(event.pageY, this);
        var len = Math.sqrt(Math.pow((ex-bx),2) + Math.pow((ey-by),2));
        if (len > 50) { 
            this.plot.lines.push([[bx,by],[ex,ey]]);
        }
        this.plot.drawlines();
    };

    function _keyActions(event) { 
        var p = this.plot;
        if(event.ctrlKey) { 
            if(event.keyCode === 90) {
                var line = p.lines.pop();
                if(line) 
                    p.undolines.unshift(line);
                p.drawlines();
            } else if( event.keyCode === 89) { 
                var line = p.undolines.shift();
                if(line) 
                    p.lines.push(line); 
                p.drawlines();
            } 
        } else if(event.altKey) {
            if (event.keyCode === 107) { 
                p.zoom(1);
            } else if (event.keyCode === 109) { 
                p.zoom(0);
            } 
        } 
        
    }; 

    /* event handlers in the Pan and zoom mode */
    var _beginPanning = function(event) { 
        this.style.cursor = 'move';
        var ctx = this.plot.octx;
        ctx.begin_x = this.plot._canvasOffsetX(event.pageX, this);
        ctx.begin_y = this.plot._canvasOffsetY(event.pageY, this);
        ctx.start = true;
    };  
    var _doPanning = function(event) { 
        var p = this.plot;
        var ctx = p.octx;
        var myx = p._canvasOffsetX(event.pageX, this);
        var myy = p._canvasOffsetY(event.pageY, this);
        var xo = myx - ctx.begin_x;
        var yo = myy - ctx.begin_y;
        
        if(ctx.start) {
            if (Math.abs(xo) > p.cp.minwidth) {
                size = Math.floor(xo/p.cp.minwidth); 
                p._doplot(p.ctx, p.current, size);
                ctx.begin_x = myx;
                ctx.begin_y = myy;
            } 
        }      
    };  
    var _endPanning = function(event) { 
        this.plot.octx.start = false;
        this.style.cursor = 'default';
    };  
    // Function below is not perfect. But as close to usable. 
    // Some Date formats like '12-Oct' fail. But yes, thats understandable.  
    function _getDateTs(str) { 
        var d;
        d = new Date(str).getTime();
        if (!isNaN(d)) {
            return d;
        }
        str = str.replace(/-/g, ' '); //1 Jan 2010 works but 1-Jan-2010 doesn't
        d = new Date(str).getTime();
        if (!isNaN(d)) {
            return d;
        }
        // may be what we've is a time stamp. 
        if((d = parseInt(str)) > 100000) { 
            // we are not handling something that's up on 1st Jan 1971, as yet.
            // assume it is a valid time stamp and just send it back.
           return d;
        }  
    };

    function _tsToDate(ts) {
        var d = new Date(ts);
        var dd = d.getDate();
        var mm = d.getMonth() + 1;
        dd = (dd >= 10? dd : '0' + dd); 
        mm = (mm >= 10? mm : '0' + mm);       
        yy = d.getFullYear(); 

        return yy + '-' + mm + '-' + dd;
    }; 

    // The following validation should ideally be done by the client who calls us
    // but, let's not assume client actually validates, we validate is again.
    // better idea may be to move such functions into utils and have 'optionally' include utils 
    function validParams(type, params) {
        var notalpha = /[^a-z]+/g
        var notnumeric = /[^0-9]+/g
        var isfloat = /(^\.|[0-9]+\.)[0-9]+$/g
        switch(type) {
        case 'ema':
        case 'sma':
            if (params.length != 2) {
                return false;
            } 
            if (params[0].match(notalpha)) { 
                return false;
            } 
            if (params[1].match(notnumeric)) { 
                return false;
            }   
            var validmas = ['open', 'high', 'low', 'close']
            var matched = false;
            for (i in validmas) { 
                if (validmas[i] === params[0]) {
                    matched = true;
                } 
            }
            if(!matched) vmsg = 'first parameter is not one of open,high,low,close';
            return matched;
        case 'bbands':
        case 'psar':
            if(params.length != 2) { 
                vmsg = 'Invalid length of params: expected 2, received ' + params.length;
                return false;
            }
            for (var i in params) { 
                if (params[i].match(notnumeric) && !params[i].match(isfloat)) {
                    return false; 
                }
            }
            return true;
    
        case 'stoch':
        case 'macd' : 
            if (params.length != 3) {
                return false;
            }
            for (var i in params) { 
                if(params[i].match(notnumeric)) { 
                    return false; 
                } 
            }
            return true;
        
         case 'rsi': 
            if(params.length != 1) { 
                return false;
            } 
            if (params[0].match(notnumeric)) { 
                return false;
            } 
            return true;
         default:
            return false;
        }

        // if we come here, something is wrong, so let's return false
        return false;
    }; 

    /* Following functions are used from jQuery 
        The reason for doing this
        1. jquery does it properly 
        2. Including jquery for three functions is kind of an overkill. So 
            we'd keep including functions from jquery in here. If and when
            this becomes too big to be so, we'd just use jQuery library.

        Copyright 2010, John Resig (http://jquery.org/license)

    */
    function parseJSON(data) { 
		if ( typeof data !== "string" || !data ) {
			return null;
		}

	    var rtrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g,
		// Make sure leading/trailing whitespace is removed (IE can't handle it)
		data = data.replace(rtrim, "");
		
		// Make sure the incoming data is actual JSON
		// Logic borrowed from http://json.org/json2.js
		if ( /^[\],:{}\s]*$/.test(data.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
			.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
			.replace(/(?:^|:|,)(?:\s*\[)+/g, "")) ) {

			// Try to use the native JSON parser first
			return window.JSON && window.JSON.parse ?
				window.JSON.parse( data ) :
				(new Function("return " + data))();

		} else {
			throw  "JSON parse error:"; 
		}
    };

    function isArray(a) { 
		return Object.prototype.toString.call(a) === "[object Array]";
    };
    function isFunction(f) { 
		return Object.prototype.toString.call(f) === "[object Function]";
    };

    // Our own lame selector. 
    function $$(selector) { 
        if (typeof selector !== "string" || !selector) {
            return e;
        }

        // someone gave us #id or div#id. just take the id part out. 
        var i = selector.search('#');
        if(i !== -1) { 
            id = selector.substring(i+1); 
            return document.getElementById(id);
        } else { 
            // we still try by ID in case someone forgot to send the #
            var e = document.getElementById(selector);
            if (!e) { 
                // first of all elements by given name  
                e = document.getElementsByName(selector)[0];
            } 
            // we return whatever we got . 
            return e;
        }     
    };
})(window);
