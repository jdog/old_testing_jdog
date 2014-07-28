jdog.integrationTest(function(Sync, Async, comparer) {

	var dog = {
		$iframe       : $("#testPage")
		, innerJS     : undefined
		, innerWindow : undefined
		, $           : undefined
	}

	Async("home page", function(series, go, call) {

		series.push(function() {
			jdog.injectJQuery(dog, go, call)
		})

		series.push(function() {
			call({ name : "count of heading tags", result : 5 === dog.$("h1").length })
			go()
		})

		series.push(function() {
			call({ name : "second heading says Hello 1", result : dog.$("h1").eq(1).html() === "Hello 1" })
			go()
		})

		go()

	})


	return dog

})
