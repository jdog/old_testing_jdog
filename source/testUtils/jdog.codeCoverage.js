PAGE.add("Utils.CodeCoverage", function CodeCoverage (hashOfScriptsToCheck, test) {

	var dog = {
		escodegen : undefined /* replaced with windows.escodegen */
		, acorn : undefined /* replaced with windows.acorn */

		, hashOfScriptsToCheck : hashOfScriptsToCheck
		, modifiedScriptsToCheck : undefined
		, test : test

		, results : {
			"Constructors.SomeConstructor" : { totalPoints : 123, hits : {}, misses : {} }
		}

		, start : function(func) {

			// add acorn for parsing js files
			PAGE.AddExternalLib("/Scripts/testUtils/esprima.js", "esprima", function(esprima) {

			// adding code for code traversal, and appending the global function to add trace points
			PAGE.AddExternalLib("/Scripts/testUtils/esmorph.js", "esmorph", function(esmorph) {

			// add escodegen for writing new modified code
			PAGE.AddExternalLib("/Scripts/testUtils/escodegen.browser.js", "escodegen", function(escodegen) {

				mapAllConstructors()
				// mapPoints("Constructors.DoubleClickDoubleSelect")

				// now it's ready and we can run the callback
				typeof func === "function" && func()

			})
			})
			})

			return this
		}

		, getTotals : function() {

			var countComplete = 0
				, countPossible = 0
				, countMissed = 0

			for(var a in dog.results) {
				countPossible += dog.results[a].totalPoints
			}

			for(var b in dog.results) {
				for (var y in dog.results[b].hits) countComplete += 1
				for (var z in dog.results[b].misses) countMissed += 1
			}


			for(var x in dog.results) {
				dog.results[x].hitsCount = countComplete
			}

			return {
				countComplete : countComplete
				, countPossible : countPossible
				, countMissed : countPossible - countComplete
			}

		}

		, getByPath : function(path) {
			var results = dog.results[path]

			if (!results) return

			results.hitsMissed = (function() {
				var missed = 0
				for (var x in results.misses) missed++
				return missed
			}())

			results.hitsCount = (function() {
				var count = 0
				for (var x in results.hits) count++
				return count
			}())

			if (!results) return undefined
			return results
		}
	}


	// Ahh, a beautiful piece of code from esprima.org. Modified to return fuller object
	// http://esprima.org/demo/functiontrace.html
	// requires esprima, and esmorph
	function traceInstrument(code, path) {
		var tracer, signature, code, converted

		tracer = esmorph.Tracer.FunctionEntrance(function (fn) {
			signature =  'PAGE.trace.enterFunction({ '
			signature += 'name: "' + fn.name + '"'
			signature += ', lineNumber: ' + fn.loc.start.line
			signature += ', range: [' + fn.range[0] + ',' + fn.range[1] + ']'
			signature += ', path: "' + path + '"'
			signature += ' });'
			return signature
		})

		converted = esmorph.modify(code, tracer)

		// modified to return full object with count
		return converted
	}

	function mapAllConstructors() {
		for (var x in PAGE.Constructors) mapPoints("Constructors." + x)
	}

	function mapPoints(key) {

		var script = PAGE.exists(key)
		if (!script) return

		var modifiedScript = traceInstrument( "var Constructor = " + script, key )

		/* modifiedScript = {
			code : "new code here with trace points"
			, functionList: Array[35] // amount of trace points added
			, param: Object
			, signature: "" // the trace function itself
			, tree: Object // full tree
		} */

		dog.results[key] = { totalPoints : modifiedScript.functionList.length, hits : {}, misses : {} }

		modifiedScript.functionList.forEach(function( element, index, arr) {
			dog.results[key].misses[ element.loc.start.line ] = element
		})

		eval(modifiedScript.code)

		// ONLY WORKS FOR Constructors
		PAGE.add(key, Constructor)
	}

	PAGE.trace = {
		enterFunction : function(obj) {
			/* var obj = {
				lineNumber: 1
				, name: "Constructor"
				, path: "Constructors.DoubleClickDoubleSelect"
				, range: Array[2]
			} */
			if (obj && obj.path) {
				var subKey = obj.lineNumber
				dog.results[obj.path].hits[subKey] = obj
				delete dog.results[obj.path].misses[subKey]
			}
		}
	}

	return dog

})
