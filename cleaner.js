// Define constants:
var CONSTANTS = {
	OPTIONS_HTML_URL: chrome.extension.getURL("options.html"),
	WELCOME_HTML_URL: chrome.extension.getURL("welcome.html"),
	CLEANER_CSS_URL: chrome.extension.getURL("options.css"),
	JQUERY_JS_URL: chrome.extension.getURL('third_party/jquery.js'),
	MDL_ICON_CSS_URL: chrome.extension.getURL("third_party/icon.css"),
	MDL_CSS_URL: chrome.extension.getURL("third_party/material.css"),
	LOCAL_IMAGE_STRING: "Local Image"
};

// INITIALIZATION: Perform these actions before document ready to ensure that the UI does not change after it is visible.
init();

function init() {
	load_js(CONSTANTS.JQUERY_JS_URL);
	load_css(CONSTANTS.CLEANER_CSS_URL);
	load_css(CONSTANTS.MDL_CSS_URL);
	load_css(CONSTANTS.MDL_ICON_CSS_URL);
	$("body").prepend("<div id='spacer' style='margin-top:10%'></div>");
	$("html").click(function(event) {
		// If anywhere outside of the options div is clicked, remove the class "active," which hides the div.
		if (!$("#options-div").find(event.target).length) {
			$("#options-div").removeClass("active");
			var hint = $("#close-div");
			if ((hint.length > 0) && (hint.css("display") != "none")) hint.remove();
		}
	});
	
	create_options_button();
	show_welcome();
}

function load_css(url) {
	var link = document.createElement("link");
	link.setAttribute("rel", "stylesheet");
	link.setAttribute("type", "text/css");
	link.setAttribute("href", url);
	document.head.appendChild(link);
}

function load_js(url) {
	var javascript = document.createElement("script");
	javascript.setAttribute("src", url);
	document.head.appendChild(javascript);
}

function create_options_button() {
	$.ajax(CONSTANTS.OPTIONS_HTML_URL).done(function(data) {
		$("body").first().append(data); // Create a DOM object out of the returned data and append the options panel to the DOM.
		// Open the options menu when the button is clicked.
		$("#options-header").click(function(event) {
			$("#options-div").toggleClass("active");
			if ($("#welcome-div").length) {
				$("#welcome-div").remove();
				$("#close-div").show();
			}
			else if ($("#close-div").length) {
				$("#close-div").remove();
				chrome.storage.sync.set({
					ShowTutorial: false
				});
			}
		});
		// Save and refresh the DOM whenever the value changes.
		$(".refresh-on-change").change(function() {
			save_options();
			restore_options();
		});
		// Allow the user to press enter to reload a custom image
		$("#BgImage").keyup(function (e) {
			if (e.keyCode == 13) { // Enter automatically refreshes the DOM.
				save_options();
				restore_options();
			}
			if (e.keyCode == 27) {
				$("#BgImage").val("");
			}
		});
		// Pressing "apply" also refreshes the DOM.
		$("#ApplyBgImage").click(function() {
			save_options();
			restore_options();
		});
		// When the user selects a local image:
		$("#BrowseImage").change(function(evt) {
			// From Stackoverflow
			var tgt = evt.target || window.event.srcElement;
        	var files = tgt.files;
			
			if (FileReader && files && files.length) {
		        var fr = new FileReader();
		        fr.onload = function () {
					$("html").first().css("background-image", "url('" + fr.result + "')");
					$("#BgImage").val(CONSTANTS.LOCAL_IMAGE_STRING); // Remember that the user selected a local image.
					save_options();
		        }
		        fr.readAsDataURL(files[0]);
		    }	
		});
		restore_options(); // Restore user's previous options.
	});
}

// Saves options to chrome.storage
function save_options() {
	var bgValue = document.getElementById("BgImage").value;
	if (bgValue == CONSTANTS.LOCAL_IMAGE_STRING) {
		var cssBgString = $("html").first().css("background-image");
		bgValue = cssBgString.substring(4, cssBgString.length - 1); // Remove "url(' and the the ending )
	}
	
	chrome.storage.local.set({
		ShowPlus: document.getElementById("ShowPlus").checked,
		ShowGoogleLogo: document.getElementById("ShowGoogleLogo").checked,
		ShowSearchBar: document.getElementById("ShowSearchBar").checked,
		ShowPages: document.getElementById("ShowPages").checked,
		ShowInfo: document.getElementById("ShowInfo").checked,
		VisitedOpacity: document.getElementById("Opacity").value / 100,
		BgImagePath: bgValue
	});
}

// Restores options from chrome.storage
function restore_options() {
	chrome.storage.local.get({
		ShowPlus: true,
		ShowGoogleLogo: true,
		ShowSearchBar: true,
		ShowPages: true,
		ShowInfo: true,
		VisitedOpacity: 1,
		BgImagePath: ""
	}, function(items) {
		// Restore Preferences
		var bgValue = items.BgImagePath;
		if (bgValue.indexOf("data:image") != -1) {
			bgValue = CONSTANTS.LOCAL_IMAGE_STRING;
		}
		
		document.getElementById("ShowPlus").checked = items.ShowPlus;
		document.getElementById("ShowGoogleLogo").checked = items.ShowGoogleLogo;
		document.getElementById("ShowSearchBar").checked = items.ShowSearchBar;
		document.getElementById("ShowPages").checked = items.ShowPages;
		document.getElementById("ShowInfo").checked = items.ShowInfo;
		document.getElementById("Opacity").value = items.VisitedOpacity * 100;
		document.getElementById("BgImage").value = bgValue;
		
		// Hide requested items.
		if (items.ShowPlus) $("#mngb").show();
			else $("#mngb").hide();
		if (items.ShowSearchBar) $("#f").show();
			else $("#f").hide();
		if (items.ShowPages) $("#most-visited").show();
			else $("#most-visited").hide();
		if (items.ShowInfo) $("#prm-pt").hide();
			else $("#prm-pt").hide();
			
		if (items.ShowGoogleLogo) {
			$("#lga").show();
			$("#spacer").hide();
		}
		else {
			$("#lga").hide();
			$("#spacer").show();
			
		}

		// Set background image:
		if (items.BgImagePath.length != 0) {
			var self = this;
			var initialLength = $("body").first().css("background").length;
			// Chrome will set a white background a certain time AFTER document ready for some reason.
			// This setInterval is meant to determine once Chrome has set this white background and to undo its effects.
			var bgCheck = setInterval(function() {
				if ($("body").first().css("background").length != self.initialLength) {
					$("body").first().css("background", "rgba(0,0,0,0)");
					clearInterval(self.bgCheck);
				}
			}, 50);
			$("html").first().css("background-image", "url('" + items.BgImagePath + "')");
			$("html").first().css("background-size", "cover");
		}
		else {
			$("html").first().css("background-image", "");
		}
		
		$("#most-visited").css("opacity", items.VisitedOpacity);
	});
}

function show_welcome() {
	chrome.storage.sync.get({
		ShowTutorial: true
	}, function(items) {
		if (items.ShowTutorial || true) {
			// Load welcome module.
			$.ajax(CONSTANTS.WELCOME_HTML_URL).done(function(data) {
				$("body").first().append($(data));
				$("#close-div").hide();
				$(".cleaner-close-button").click(function() {
					$(".cleaner-hint").fadeOut().promise().done(function() {
						$(".cleaner-hint").remove();
					});
					chrome.storage.sync.set({
						ShowTutorial: false
					});
				});
			});
		}
	});
}