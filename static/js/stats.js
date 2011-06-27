/* 
 * Some useful statistical routines in Javascript. 
 * Inspired by - stats.py 
 * 
 * Copyright (c) 2010 - Abhijit Gadgil <gabhijit@gmail.com>
 */

(function($) { 
    $.stats = {
        /* same for population and sample means */ 
        mean : function(data) {
            if (!_numArray(data)) { 
                return undefined;
            } 
            var s = _sum(data); 
            return s/data.length;
        },

        /* population variance sum((x - ux)^2)/n*/
        pvar: function(data) { 
            if (!_numArray(data)) { 
                return undefined;
            } 
            var u = this.mean(data);
            var darray  = [];
            for(var i = 0; i < data.length; i++) {
                darray.push(Math.pow((data[i]-u),2));
            }
            var pvar = _sum(darray)/data.length;
            return pvar;
        },
        /* population std. dev sqrt(pvar);*/
        pstdev : function(data) {
            return Math.sqrt(this.pvar(data));
        }
    };
    /* internal function assumes the caller has performed sanity checks 
     Original : //+ Carlos R. L. Rodrigues
                //@ http://jsfromhell.com/array/sum [rev. #1]
    */
    _sum =  function(a) { 
       for(var s = 0, i = a.length;i; s += a[--i]);    
       return s;
    }; 

    /* Sanity check. Making sure, the array passed is an array of numbers */
    _numArray = function(o) {
        toString = Object.prototype.toString; // FIXME : need at a proper place.
        if (toString.call(o) !== '[object Array]') {
            return false;
        } 
        for(i in o) {
            if(toString.call(o[i]) !== '[object Number]') {
                return false;
            }
        }
        return true;
    };
})(window);
