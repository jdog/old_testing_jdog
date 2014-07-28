PAGE.extend(function(inst, proto, log) {

	var dog = {
		mobile : typeof(window.orientation) !== "undefined"
		, browserInfo : []
		, OS : {}
		, Name : ""
	}

	dog.browserInfo = (function() {
		var n = navigator
			, name = n.appName
			, ver = n.appVersion
			, ua = n.userAgent
			, M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i)
			, os = "os-unknown"
			, tem

		/* get the operating system */
		if (ver.indexOf("Win")!==-1) os = "Win"
		if (ver.indexOf("Mac")!==-1) os = "Mac"
		if (ver.indexOf("X11")!==-1) os = "X11"
		if (ver.indexOf("Linux")!==-1) os = "Linux"
		dog.OS = os

		/* special check for IE11 */
		if(!!ua.match(/Trident.*rv[ :]*11\./)) {
			dog.MSIE = "11"
			dog.Name = "MSIE"
			delete dog.Netscape
		}

		/* spit out the raw data */
		if (M && (tem = ua.match(/version\/([\.\d]+)/i)) !== null) M[2] = tem[1]
		M = M ? [M[1], M[2]] : [name, n.appVersion,'-?']
		return M
	})()

	/* set browser name as property, like jQuery used to do */
	dog[dog.browserInfo[0]] = dog.browserInfo[1]

	if (!dog.MSIE) {
		dog.Name = dog.browserInfo[0]
	} else {
		dog.Name = "MSIE"
	}

	/* affix the browser info to HTML tag, for css goodness */
	if (typeof $ === "function") {
		$(document).ready(function() {
			$("html").addClass(dog.OS).addClass(dog.browserInfo[0]).addClass(dog.browserInfo.toString().replace(/[.,]/g,"_"))
		})
	}

	inst.Browser = dog

	if (dog.MSIE && dog.MSIE === "8.0") {
		// lets pray it's there
		PAGE.loadScript("/Scripts/json2.js")
	}

	return dog
})
