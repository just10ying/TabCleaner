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
	loadJavascript(CONSTANTS.JQUERY_JS_URL);
	loadCSS(CONSTANTS.CLEANER_CSS_URL);
	loadCSS(CONSTANTS.MDL_CSS_URL);
	loadCSS(CONSTANTS.MDL_ICON_CSS_URL);
	$("body").prepend("<div id='spacer' style='margin-top:10%'></div>");
	$("html").click(function(event) {
		// If anywhere outside of the options div is clicked, hide the options panel.
		if (!$("#options-card").find(event.target).length && !$("#settings-icon-div").find(event.target).length) {
			hideOptions();
		}
	});

	createOptionsButton();
	showWelcome();
}

function loadCSS(url) {
	var link = document.createElement("link");
	link.setAttribute("rel", "stylesheet");
	link.setAttribute("type", "text/css");
	link.setAttribute("href", url);
	document.head.appendChild(link);
}

function loadJavascript(url) {
	var javascript = document.createElement("script");
	javascript.setAttribute("src", url);
	document.head.appendChild(javascript);
}

function createOptionsButton() {
	$.ajax(CONSTANTS.OPTIONS_HTML_URL).done(function (data) {
		$("body").first().append(data); // Create a DOM object out of the returned data and append the options panel to the DOM.
		hideOptions();
		// Open the options menu when the button is clicked.
		$("#open-settings").click(function (event) {
			showOptions();
			if ($("#welcome-div").length) {
				$("#welcome-div").remove();
				chrome.storage.sync.set({
					ShowTutorial: false
				});

			}
		});
		$("#close-button").click(hideOptions);
		$("#close-x").click(hideOptions);
		$("#choose-file-button").click(selectLocalImage);
		$("#apply-bg-image").click(applyBgImage);
		// Save and refresh the DOM whenever the value changes.
		$(".refresh-on-change").change(function() {
			saveOptions();
			restoreOptions();
		});
		// Allow the user to press enter to reload a custom image
		$("#bg-image-text").keyup(function(e) {
			if (e.keyCode == 27) {
				$("#bg-image-text").val("");
			}
			else if (e.keyCode == 13) {
				saveOptions();
				restoreOptions();
			}
		});
		// Pressing "apply" also refreshes the DOM.
		$("#apply-bg-image").click(function () {
			saveOptions();
			restoreOptions();
		});
		// When the user selects a local image:
		$("#image-browse-input").change(function (evt) {
			// From Stackoverflow
			var tgt = evt.target || window.event.srcElement;
			var files = tgt.files;

			if (FileReader && files && files.length) {
				var fr = new FileReader();
				fr.onload = function () {
					$("html").first().css("background-image", "url('" + fr.result + "')");
					$("#bg-image-text").val(CONSTANTS.LOCAL_IMAGE_STRING); // Remember that the user selected a local image.
					saveOptions();
				}
				fr.readAsDataURL(files[0]);
			}
		});
		restoreOptions(); // Restore user's previous options.
	});
}

// Saves options to chrome.storage
function saveOptions() {
	var bgValue = document.getElementById("bg-image-text").value;
	if (bgValue == CONSTANTS.LOCAL_IMAGE_STRING) {
		var cssBgString = $("html").first().css("background-image");
		bgValue = cssBgString.substring(4, cssBgString.length - 1); // Remove "url(' and the the ending )
	}

	chrome.storage.local.set({
		ShowPlus: document.getElementById("show-plus-checkbox").checked,
		ShowGoogleLogo: document.getElementById("show-logo-checkbox").checked,
		ShowSearchBar: document.getElementById("show-search-checkbox").checked,
		ShowPages: document.getElementById("show-pages-checkbox").checked,
		ShowInfo: document.getElementById("show-info-checkbox").checked,
		VisitedOpacity: document.getElementById("Opacity").value / 100,
		BgImagePath: bgValue
	});
}

// Restores options from chrome.storage
function restoreOptions() {
	chrome.storage.local.get({
		ShowPlus: true,
		ShowGoogleLogo: true,
		ShowSearchBar: true,
		ShowPages: true,
		ShowInfo: true,
		VisitedOpacity: 1,
		BgImagePath: ""
	}, function (items) {
		// Restore Preferences
		var bgValue = items.BgImagePath;
		if (bgValue.indexOf("data:image") != -1) {
			bgValue = CONSTANTS.LOCAL_IMAGE_STRING;
		}

		document.getElementById("show-plus-checkbox").checked = items.ShowPlus;
		document.getElementById("show-logo-checkbox").checked = items.ShowGoogleLogo;
		document.getElementById("show-search-checkbox").checked = items.ShowSearchBar;
		document.getElementById("show-pages-checkbox").checked = items.ShowPages;
		document.getElementById("show-info-checkbox").checked = items.ShowInfo;
		document.getElementById("Opacity").value = items.VisitedOpacity * 100;
		document.getElementById("bg-image-text").value = bgValue;
		
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
			var bgCheck = setInterval(function () {
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

function selectLocalImage() {
	$("#image-browse-input").trigger("click");
}

function applyBgImage() {
	saveOptions();
	restoreOptions();
}

function showWelcome() {
	chrome.storage.sync.get({
		ShowTutorial: true
	}, function (items) {
		if (items.ShowTutorial) {
			// Load welcome module.
			$.ajax(CONSTANTS.WELCOME_HTML_URL).done(function (data) {
				$("body").first().append($(data));
				$(".cleaner-close-button").click(function () {
					$(".cleaner-hint").fadeOut().promise().done(function () {
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

function showOptions() {
	$("#options-card").addClass("active");
}

function hideOptions() {
	$("#options-card").removeClass("active");
}