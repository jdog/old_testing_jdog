PAGE.wait("test", function(test) {

	if ( !Date.prototype.toISOString ) {
		( function() {

			function pad(number) {
				if ( number < 10 ) {
					return '0' + number;
				}
				return number;
			}

			Date.prototype.toISOString = function() {
				return this.getUTCFullYear() +
			'-' + pad( this.getUTCMonth() + 1 ) +
			'-' + pad( this.getUTCDate() ) +
			'T' + pad( this.getUTCHours() ) +
			':' + pad( this.getUTCMinutes() ) +
			':' + pad( this.getUTCSeconds() ) +
			'.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
			'Z';
			};

		}() );
	}

	var browser = PAGE.exists("Browser") || {}

	// this adds ability to send this data to external API, 
	// ideally for monitoring the test
	test.externalCall = function(data, callback) {

		callback = callback || function(){}

		var d = new Date()
			, m = String(d.getMonth() + 1)
			, day = String(d.getDate())

		if (m.length === 1) m = "0" + m
		if (day.length === 1) day = "0" + day

		var formatDate = d.getFullYear() + "." + m + "." + day

		// add the timestamp
		data["@timestamp"] = d.toISOString()
		data["tags"] = "vardog"
		data.Browser = browser

		$.ajax({
			// url : "http://localhost:9200/logstash-2014.03.28/logs?routing=test"
			url : "http://logstash-1.docstoc.corp:9200/logstash-" + formatDate + "/logs?routing=test"
			, crossDomain: true
			, type : "POST"
			, dataType : 'json'
			, processData: false
			, data : (function() {
				var ret
				try {
					ret = JSON.stringify(data)
				return ret
				}
				catch(e) {
					return ""
			 	}
				return ""
			}())
			, success : callback
		})
	}

})
