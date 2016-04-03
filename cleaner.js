// Define constants:
var CONSTANTS = {
	OPTIONS_HTML_URL: chrome.extension.getURL("options.html"),
	WELCOME_HTML_URL: chrome.extension.getURL("welcome.html"),
	CLEANER_CSS_URL: chrome.extension.getURL("options.css"),
	JQUERY_JS_URL: chrome.extension.getURL('third_party/jquery.js'),
	MDL_ICON_CSS_URL: chrome.extension.getURL("third_party/icon.css"),
	MDL_CSS_URL: chrome.extension.getURL("third_party/material.css"),
	LOCAL_IMAGE_STRING: "Local Image",
	HTTPS_REQUIRED_STRING: "Image must be loaded over https.  Try appending https:// or changing http to https.",
	HTTPS_OK_STRING: "Set Background"
};

// INITIALIZATION: Perform these actions before document ready to ensure that the UI does not change after it is visible.
init();

function init() {
	clearBodyBackground();
	loadJavascript(CONSTANTS.JQUERY_JS_URL);
	loadCSS(CONSTANTS.CLEANER_CSS_URL);
	loadCSS(CONSTANTS.MDL_CSS_URL);
	loadCSS(CONSTANTS.MDL_ICON_CSS_URL);
	createOptionsButton();
	showWelcome();
	
	$("body").prepend("<div id='spacer' style='margin-top:10%'></div>");
	$("html").click(function(event) {
		// If anywhere outside of the options div is clicked, hide the options panel.
		if (!$("#options-card").find(event.target).length && !$("#settings-icon-div").find(event.target).length) {
			hideOptions();
		}
	});
}

function createOptionsButton() {
	$.ajax(CONSTANTS.OPTIONS_HTML_URL).done(function (data) {
		$("body").first().append(data); // Create a DOM object out of the returned data and append the options panel to the DOM.
		
		$("#open-settings").click(showOptions);
		$("#close-button").click(hideOptions);
		$("#close-x").click(hideOptions);
		$("#choose-file-button").click(selectLocalImage);
		$(".refresh-on-change").change(reapplySettings);
		$("#choose-url-button").click(showURLOptions);
		$("#clear-bg-button").click(function() {
			$("#bg-image-text").val("");
			setBackgroundImage("url('" + $("#bg-image-text").val() + "')");
			hideURLOptions();
			reapplySettings();
		});
		$("#done-url-button").click(function() {
			setBackgroundImage("url('" + $("#bg-image-text").val() + "')");
			hideURLOptions();
			reapplySettings();
		});
		$("#opacity-slider")[0].oninput = function () {
   			reapplySettings(); 
		};
		
		// Allow the user to press enter to reload a custom image
		$("#bg-image-text").keyup(function(e) {
			if (e.keyCode == 27) {
				$("#bg-image-text").val("");
			}
			else if (e.keyCode == 13) {
				setBackgroundImage("url('" + $("#bg-image-text").val() + "')");
				reapplySettings();
			}
			// Check if https:
			if ($("#bg-image-text").val().indexOf("https://") < 0) {
				$("#done-url-button").prop("disabled", true); // Prevent user from setting the background.
				$("#https-required-message").show();
			}
			else {
				$("#done-url-button").prop("disabled", false); // Allow user to set the background.
				$("#https-required-message").hide();
			}
		});
		
		// When the user selects a local image:
		$("#image-browse-input").change(function (evt) {
			// From Stackoverflow
			var tgt = evt.target || window.event.srcElement;
			var files = tgt.files;

			if (FileReader && files && files.length) {
				var fr = new FileReader();
				fr.onload = function () {
					setBackgroundImage("url('" + fr.result + "')");
					$("#bg-image-text").val(CONSTANTS.LOCAL_IMAGE_STRING); // Remember that the user selected a local image.
					saveOptions();
				}
				fr.readAsDataURL(files[0]);
			}
		});
		
		restoreOptions(); // Restore user's previous options.
		hideOptions(); // Option menu is hidden, initially.
	});
}

// Saves options to chrome.storage
function saveOptions() {
	chrome.storage.local.set({
		ShowPlus: document.getElementById("show-plus-checkbox").checked,
		ShowGoogleLogo: document.getElementById("show-logo-checkbox").checked,
		ShowSearchBar: document.getElementById("show-search-checkbox").checked,
		ShowPages: document.getElementById("show-pages-checkbox").checked,
		ShowInfo: document.getElementById("show-info-checkbox").checked,
		VisitedOpacity: document.getElementById("opacity-slider").value / 100,
		BgImageValue: $("html").first().css("background-image")
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
		BgImageValue: 'url("")'
	}, function (items) {
		// Restore Preferences
		document.getElementById("show-plus-checkbox").checked = items.ShowPlus;
		document.getElementById("show-logo-checkbox").checked = items.ShowGoogleLogo;
		document.getElementById("show-search-checkbox").checked = items.ShowSearchBar;
		document.getElementById("show-pages-checkbox").checked = items.ShowPages;
		document.getElementById("show-info-checkbox").checked = items.ShowInfo;
		document.getElementById("opacity-slider").value = items.VisitedOpacity * 100;
		$("html").first().css("background-image", items.BgImageValue);
		
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

		setBackgroundImage(items.BgImageValue);
		$("#most-visited").css("opacity", items.VisitedOpacity);
	});
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

function reapplySettings() {
	saveOptions();
	restoreOptions();
}

/* -------------------------------- Resource Loading Functions  -------------------------------- */

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

/* -------------------------------- Background Handling -------------------------------- */

// Chrome will set a white background a certain time AFTER document ready for some reason.
function clearBodyBackground() {
	var self = this;
	var initialLength = $("body").first().css("background").length;
	// This setInterval is meant to determine once Chrome has set this white background and to undo its effects.
	var bgCheck = setInterval(function () {
		if ($("body").first().css("background").length != self.initialLength) {
			$("body").first().css("background", "rgba(0,0,0,0)");
			clearInterval(self.bgCheck);
		}
	}, 50);
}

function setBackgroundImage(imageValue) {
	$("html").first().css("background-image", imageValue);
	$("html").first().css("background-size", "cover");
}

function selectLocalImage() {
	hideURLOptions();
	$("#image-browse-input").trigger("click");
}

/* -------------------------------- Hiding and showing -------------------------------- */

function showOptions() {
	$("#options-card").addClass("active");
	if ($("#welcome-div").length) {
		$("#welcome-div").remove();
		chrome.storage.sync.set({
			ShowTutorial: false
		});
	}
}

function hideOptions() {
	$("#options-card").removeClass("active");
	hideURLOptions();
}

function showURLOptions() {
	$("#options-card").addClass("full");
}

function hideURLOptions() {
	$("#options-card").removeClass("full");
	$("#https-required-message").hide();
}