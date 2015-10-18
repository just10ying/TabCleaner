// INITIALIZATION: Perform these actions before document ready to ensure that the UI does not change after it is visible.
init();

var fullImageName; // A copy of the image name in case it is longer than 512KB.

function init() {
	$("html").first().css("height", "100%");
	$("html").first().css("overflow", "hidden");
	$("body").prepend("<div id='spacer' style='margin-top:10%'></div>");
	$("html").click(function(event) {
		if (!$("#options-div").find(event.target).length) {
			$("#options-div").removeClass("active");
			var hint = $("#close-div");
			if ((hint.length > 0) && (hint.css("display") != "none")) hint.remove();
		}
	});
	load_css();
	load_js();
	create_options_button();
	show_welcome();
}

function load_css() {
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('type', 'text/css');
	link.setAttribute('href', chrome.extension.getURL('options.css'));
	document.getElementsByTagName('head')[0].appendChild(link);
}

function load_js() {
	var jquery = document.createElement('script');
	jquery.setAttribute('src', chrome.extension.getURL('jquery.js'));
	document.getElementsByTagName('body')[0].appendChild(jquery);
}

function create_options_button() {
	$.ajax(chrome.extension.getURL("options.html")).done(function(data) {
		$("html").first().append($(data)); // Append the options panel to the DOM.
		// Open the options menu when the button is clicked.
		$("#options-header").click(function(event) {
			$('#options-div').toggleClass('active');
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
			if (e.keyCode == 13) {
				save_options();
				restore_options();
			}
			if (e.keyCode == 27) {
				$("#BgImage").val("");
			}
		});
		$("#ApplyBgImage").click(function() {
			save_options();
			restore_options();
		});
		$("#BrowseImage").change(function(evt) {
			// From Stackoverflow
			var tgt = evt.target || window.event.srcElement;
			var filename = evt.target.value;
        	var files = tgt.files;
			
			if (FileReader && files && files.length) {
		        var fr = new FileReader();
		        fr.onload = function () {
					$("html").first().css("background-image", "url('" + fr.result + "')");
					$("#BgImage").val("Local Image");
					fullImageName = fr.result;
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
	var bgValue = document.getElementById('BgImage').value;
	if (bgValue == "Local Image") {
		bgValue = fullImageName;
	}
	
	chrome.storage.local.set({
		ShowPlus: document.getElementById('ShowPlus').checked,
		ShowGoogleLogo: document.getElementById('ShowGoogleLogo').checked,
		ShowSearchBar: document.getElementById('ShowSearchBar').checked,
		ShowPages: document.getElementById('ShowPages').checked,
		ShowInfo: document.getElementById('ShowInfo').checked,
		VisitedOpacity: document.getElementById('Opacity').value / 100,
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
			fullImageName = bgValue;
			bgValue = "Local Image";
		}
		
		document.getElementById('ShowPlus').checked = items.ShowPlus;
		document.getElementById('ShowGoogleLogo').checked = items.ShowGoogleLogo;
		document.getElementById('ShowSearchBar').checked = items.ShowSearchBar;
		document.getElementById('ShowPages').checked = items.ShowPages;
		document.getElementById('ShowInfo').checked = items.ShowInfo;
		document.getElementById('Opacity').value = items.VisitedOpacity * 100;
		document.getElementById('BgImage').value = bgValue;
		
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
		if (items.ShowTutorial) {
		// if (true) {
			// Load welcome module.
			$.ajax(chrome.extension.getURL("welcome.html")).done(function(data) {
				$("html").first().append($(data));
				$("#welcome-div").show();
				$(".cleaner-close-button").click(function() {
					$(".cleaner-hint").remove();
					chrome.storage.sync.set({
						ShowTutorial: false
					});
				});
			});
		}
	});
}