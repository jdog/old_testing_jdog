// using extend, puppy is instance, dog is prototype, and log is logging
var jdog = PAGE.extend(function(puppy, dog, console) {

	var results = []
	, allTestFiles = []
	, allTestMaps = {}
	, allTestMapsFlipped = {}
	, onFinished = []
	, f = function(){}

	var dtest = dog.test = {
		results : results
		, allTestFiles : dog.allTestFiles = allTestFiles
		, allTestMaps : allTestMaps
		, allTestMapsFlipped : allTestMapsFlipped

		, addTests : function(path, func ){ return this }
		, runTest : function(path){ return this }
		, runSubTests : function(){ return this }
		, runAllTests : function() { return this }
		, onFinished : function(func) { onFinished.push(func) }
		, addCoverage : function(callback) { return this }

		, activeTests : []
		, index : 0
		, _testData : dog._testData = {}
		, totalPass : 0
		, totalFail : 0
		, codeCoverage : undefined /* CodeCoverage(hashOfScriptsToCheck, test) */
		, hasCodeCoverage : false
		, Mock : function(obj) { }
		, K : "Release the Kraken!"
		, FLAG : ["%cJAY%c❄%cDOҨ","padding-left:10px; font-size:42px; color:rgb(229, 229, 209); font-weight:normal; background-color:#54E860; color:white;", "font-size:42px; color:rgb(72, 72, 138); background-color:#54E860; font-weight:normal; padding-right:5px;", "font-size:42px; color:rgb(229, 229, 209); font-weight:normal; background-color:#54E860; color:white; padding-right:10px;"]
	}

	var ref = {}

	// this overrides the PAGE.add method !
	// modifying add method to include path to test
	dog.add = function(path, obj, test) {
		if (typeof path === "undefined") return
		var arr = path.split(".")
		if (arr.length < 2) return
		var group = arr[0]
			, item = arr[1]
		if (!puppy[group]) puppy[group] = {}
		if (test) {
			// all arguments after path and object are considered test files
			for(var x = 2; x < arguments.length; x++) {
				allTestFiles.push(arguments[x])
				var testMap = {
					path : path
					, obj : obj
					, test : test
				}
				allTestMapsFlipped[arguments[x].toString()] = allTestMaps[path] = testMap
			}
		}
		return puppy[group][item] = obj
	}

	function clean(str) { return str.replace(/\./g,"_") }
	function cleanReverse(str) { return str.replace(/_/g,".") }

	function finishedResults(results) {

		for(var x = 0; x < results.length; x++) {
			if (results[x].result) dtest.totalPass += 1  
			else dtest.totalFail += 1
		}

		var countAsync = 0
			, countSync = 0
			, countPassed = dtest.totalPass
			, countFailed = dtest.totalFail
			, countTotal = Number(dtest.totalPass + dtest.totalFail)
			, countComplete = 0
			, countPossible = 0

		results.forEach(function(item, index, arr) {
			if (item.type === "sync") countSync++
			if (item.type === "async") countAsync++
		})

		var subCount = String("Σ Total Tests async [" + countAsync + "] -- sync [" + countSync + "]")

		var temp = { }

		temp[subCount] = { count : countTotal }
		temp["✔ Tests Passed"] = { count : countPassed }
		temp["✖ Tests Failed"] = { count : countFailed }

		if (PAGE.exists("test.codeCoverage")) {
			var countsCoverage = dtest.codeCoverage.getTotals()
			temp["Functions found"] = { count : countsCoverage.countPossible }
			temp["Functions covered"] = { count : countsCoverage.countComplete }
		}

		console.groupEnd()

		console.table(temp, [ "count" ])


		dtest.totalPass = 0
		dtest.totalFail = 0

	}

	dtest.onFinished(finishedResults)

	/* inherit from PAGE */
	var loadScript = dog.loadScript

	dog.test.Mock = function(name, eventsArray, func) {
		eventsArray = eventsArray || [ ]
		var triggers = { }

		function hitEvent(name) {
			if (triggers[name] !== undefined) triggers[name] = true
		}

		var obj = func(hitEvent)

		for (var x = 0; x < eventsArray.length; x++) triggers[x] = false

		obj.__eventsArray = eventsArray
	}

	dog.addTests = function(path, func /* (Constructor, Test, TestWaiter, comparer) */, isIntegration) {
		var scout = {
			syncTests : []
			, asyncTests : []
		}

		function Test(testName, resultFunc) {

			scout.syncTests.push(function() {
				var result = {
					name : testName
					, result : resultFunc()
					, test : resultFunc
					, construct : path
					, func : func
					, type : "sync"
					, testName : testName
					, testPath : dtest.lastTest
				}
				results.push(result)

				// handles external call
				if (dog.test.externalCall) {
					dog.test.externalCall(result)
				}

				if (result.result) {
					console.groupCollapsed("%c " + result.name + "%c \u2714", "color:gray; font-weight:normal;", "color:rgb(54, 231, 54)")
					console.log(result)
					console.groupEnd()


				} else {
					console.error(result.name + " \u2716 FAILED")
					console.log(result)
				}
			})

			scout.syncTests.shift()()

		}

		function TestWaiter(testName, resultFunc /* (series, go, call) */ ) {
			var series = scout.asyncTests

			function go() {
				if (series.length > 0) {
					series[0]()
				} else {
				}
			}

			function call(result) {
				result.type = "async"
				result.testName = testName
				result.seriesCount = series.length
				result.testPath = dtest.lastTest
				results.push(result)

				// handles external call
				if (dog.test.externalCall) {
					dog.test.externalCall(result)
				}

				if (result.result) {
					console.groupCollapsed("%c " + testName + ": " + result.name + "%c \u2714", "color:gray; font-weight:normal;", "color:rgb(54, 231, 54)")
					console.log(result)
					console.groupEnd()
				} else {
					console.error(testName + ": ", result.name, "\u2716 failed")
					console.error(result)
				}
				series.shift()
			}

			resultFunc(series, go, call)
		}

		function toShortString(obj) {
			var split = obj.toString().split("()")[0].split("function ")[1]
			if (split === "(e,t){return new x.fn.init(e,t,r)}") {
				return "jQuery"
			} else {
				return split
			}
		}

		function comparer(module, propertiesWithTypes) {
			var truthy = true

			 console.groupCollapsed("%ccomparer details", "color:gray; font-weight:normal")

			if (!module) {
				console.error("length: ", x, "\u2716")
				return console.groupEnd()
			}

			for (var x in propertiesWithTypes) {
				var run = true

				if (!propertiesWithTypes[x].empty && module[x] === undefined) {
					console.error(x + " is undefined", x, "\u2716")
					truthy = false
					run = false
				}

				if (typeof propertiesWithTypes[x].empty !== "undefined") {
					if (module[x] !== undefined) {
						console.error("value: ", x, "\u2716")
						console.info("value should be undefined")
						truthy = false
					} else {
						console.log("value: ", x, "\u2714")
					}
				}

				if (run && propertiesWithTypes[x].like) {
					if (module[x].constructor.toString() !== propertiesWithTypes[x].like.constructor.toString()) {
						console.error("likeness: ", x, "\u2716")
						console.info("value should be:", toShortString(module[x].constructor))
						truthy = false
					} else {
						console.log(x, "likeness: ", "\u2714", toShortString(module[x].constructor))
					}
				}
				if (run && propertiesWithTypes[x].length) {
					if (module[x].length !== propertiesWithTypes[x].length) {
						console.error("length: ", x, "\u2716")
						console.info("value should be:", module[x].length)
						truthy = false
					} else {
						console.log(x, "length: ", "\u2714", module[x].length)
					}
				}
				if (run && typeof propertiesWithTypes[x].value !== "undefined") {
					if (module[x] !== propertiesWithTypes[x].value) {
						console.error("value: ", x, "\u2716")
						console.info("value should be:", propertiesWithTypes[x].value)
						truthy = false
					} else {
						console.log(x, "value: ", "\u2714", propertiesWithTypes[x].value)
					}
				}
			}

			console.groupEnd()

			return truthy
		}

		dog.addProc(function() {

			if (!scout.asyncTests.length) {

				if (PAGE.exists("test.codeCoverage")) {
					;(function() {
						var countsCoverage = dtest.codeCoverage.getTotals()
						var temp = {}
						var lastTest = dtest.lastTest
						if (!lastTest) { return alert("oop") }

						var lastTestMap = dtest.allTestMapsFlipped[lastTest]
						var lastConstructorCounts = dtest.codeCoverage.getByPath( lastTestMap.path )

						temp["functions found"] = lastConstructorCounts ? { count : lastConstructorCounts.totalPoints } : 0
						temp["functions tested"] = lastConstructorCounts ? { count : lastConstructorCounts.hitsCount } : 0
						temp["functions missed"] = lastConstructorCounts ? { count : lastConstructorCounts.hitsMissed } : 0

						console.groupEnd()
						console.group("Code Coverage")
						console.table(temp, [ "count" ])

						lastTestMap.coverage = lastConstructorCounts

						console.group("%c Coverage Info", "font-weight:normal; color:#aaa;")

						;(function() {
							var tempMissesList = {}

							if (!lastTestMap.coverage) return

							var misses = lastTestMap.coverage.misses

							for(var x in misses) {
								tempMissesList[x] = {
									lineNumber : misses[x].loc.start.line
									, column : misses[x].loc.start.column
									, name : misses[x].name
								}
							}

							console.group("Misses")
							console.table(tempMissesList, ["name", "lineNumber", "column"])
							console.groupEnd()

						}())

						;(function() {
							var tempHitsList = {}

							if (!lastTestMap.coverage) return

							var hits = lastTestMap.coverage.hits

							for(var x in hits) {
								tempHitsList[x] = {
									lineNumber : hits[x].lineNumber
									, name : hits[x].name
								}
							}

							console.groupCollapsed("Hits")
							console.table(tempHitsList, ["name", "lineNumber"])
							console.groupEnd()

						}())

						console.groupEnd()
						console.groupEnd()
					}())
				}

				console.groupEnd()

				if (dtest.activeTests.length) {
					subRunTest(dtest.activeTests.shift())
				} else {
					for(var x = 0; x < onFinished.length; x++) {
						onFinished[x](results)
					}
				}

			} else {
				dog.addProc(arguments.callee)
			}

		})

		// this is here to help when a test group is finished, clear it up

		if (isIntegration) {
			typeof func === "function" && func(Test, TestWaiter, comparer )
		} else {
			PAGE.wait(path, function(Constructor) {
				typeof func === "function" && func( Constructor, Test, TestWaiter, comparer )
			})
		}

	}

	dog.integrationTest = function() {
		var args = Array.prototype.slice.call(arguments, 0);
		args.push(true)
		args.unshift("integrationTest")
		dog.addTests.apply(this, args)
	}

	/* create a set of tests, array that gets called in sequence */
	dog.setTests = function(arr) {
		dog.allTestFiles = dog.allTestFiles.concat(arr)
	}

	/* this is to add coverage stats for all tests */
	dog.addCoverage = function addCoverage(callback) {

		if (dtest.hasCodeCoverage) {
			typeof callback === "function" && callback(dtest)
			return dtest
		}

		/* load it if it's not there */
		PAGE.exists("Utils.CodeCoverage") ? "" : loadScript("/Scripts/testUtils/page.test.codeCoverage.js")

		// Main code coverage
		PAGE.wait("Utils.CodeCoverage", function(CodeCoverage) {

			dtest.codeCoverage = CodeCoverage(PAGE.Constructors, dtest)
			.start(function() {
				typeof callback === "function" && callback(dtest)
			})

			dtest.hasCodeCoverage = true

		})

		return dtest
	}

	function outputFlag() {
		console.log.apply(console, dtest.FLAG)
	}

	dog.info = function() {
		outputFlag()
		console.dir(PAGE)
		return dtest.K
	}

	dog.runSubTests = function runSubTests() {
		dtest.results.length = 0
		dtest.activeTests = dtest.activeTests.concat( dog.allTestFiles )
		console.group.apply(console, dtest.FLAG)
		subRunTest( dtest.activeTests.shift() )
		return dtest.K
	}

	dog.runAllTests = dog.run = function runAllTests() {
		dog.addCoverage( dog.runSubTests )
		return dtest.K
	}

	function subRunTest(path) {
		dtest.lastTest = path
		loadScript(path)
		console.group(path)
		console.group("tests")
		return dtest.K
	}

	// run the individual test
	dog.runTest = function runTest (path) {
		dtest.lastTest = path
		dog.addCoverage( function() {
			dtest.results.length = 0
			loadScript(path)
			console.group(path)
			console.group("tests")
		})
		return dtest.K
	}

	dog.getPage = function($iframe, callback) {
		$iframe.each(function() {
			var _elmIFrame = $(this)[0]
			typeof callback === "function" && callback( _elmIFrame, _elmIFrame.contentWindow )
		})
	}

	dog.loadPage = function($iframe, url, callback) {
		$iframe[0].src = url
		dog.getPage($iframe, callback)
	}

	dog.injectJQuery = function(ref, go, call) {
		// this initializes the page in the frame, take a look
		dog.getPage(ref.$iframe, function(innerWindow, innerJS) {

			// pass the innerJS to our local object for future use
			ref.innerJS = innerJS

			// pass the innerWindow
			ref.innerWindow = innerWindow

			// make sure there is content in innerHTML
			dog.waitExists("document.body.innerHTML", ref.innerJS, function() {

				// now, inject some jQuery so it's easier to find things and click things
				dog.loadScript("//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js", ref.innerJS.document)

				// let's wait till it's actually loaded
				dog.wait("window.jQuery", ref.innerJS, function(jQuery) {
					ref.$ = jQuery

					// now we do the regular document.ready for jQuery
					ref.innerJS.jQuery(ref.innerJS.document).ready(function() {
						call({ name : "loaded page and injected jQuery", result : true })
						go(ref)
					})
				})
			})
		})
	}

	// Strange behavior, this is required???
	dog.waitWindow("jQuery", function() { })

})
