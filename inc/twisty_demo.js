/*
 * twisty_demo.js
 * 
 * Demonstration and testing harness for WSOH.
 * 
 * TOOD
 * - Fix document.getElementById(...) calls.
 * 
 */

var cache = window.applicationCache;
function updateReadyCache() {
  window.applicationCache.swapCache();
  location.reload(true); // For now
}

var currentCubeSize = parseInt($("#cubeDimension").val());

$(document).ready(function() {

  /*
   * Caching Stuff.
   */

  cache.addEventListener('updateready', updateReadyCache, false);

  log("Document ready.");

  var twistyScene = new twistyjs.TwistyScene();
  $("#twistyContainer").append($(twistyScene.getDomElement()));

  function setCubeSize(dim) {
    if (dim != currentCubeSize) {
      twistyScene.initializeTwisty({
        "type": "cube",
        "dimension": dim,
        allowDragging: true,
        showFps: true,
      });
      currentCubeSize = dim;
      $("#cubeDimension").blur(); 
      twistyScene.resize();
    }
  }
  setCubeSize(3);

  $("#cubeDimension").bind("input", function() {
    var dim = parseInt($("#cubeDimension").val());
    if (!dim) {
      dim = 3;
    }
    dim = Math.min(Math.max(dim, 1), 16);
    setCubeSize(dim);
    return false;
  });

  $("#alg_ccc").bind("click", function() {
    twistyScene.animateMoves(makeCCC(parseInt($("#cubeDimension").val())));
  });

  $("#lucasparity").bind("click", function() {
    twistyScene.animateMoves(lucasparity);
  });

  $("#alg_superflip").bind("click", function() {
    twistyScene.animateMoves(superflip);
  });

  $("#parsed_alg1").bind("click", function() {
    twistyScene.animateMoves(stringToAlg($("#parse_alg").val()));
  });

  twistyScene.cam(0);

  $("#enableOfflineSupport").bind("click", function() {
    window.location.href = "offline.html";
  });

  $("#createCanvasPNG").bind("click", function() {
    var canvas = twistyScene.getCanvas();
    var img = canvas.toDataURL("image/png");
    log("Generating image...");
    $("#canvasPNG").fadeTo(0, 0);
    $("#canvasPNG").html('<a href="' + img + '" target="blank"><img src="'+img+'"/></a>');
    $("#canvasPNG").fadeTo("slow", 1);
  });


  $(window).resize(twistyScene.resize);

  // TODO add visual indicator of cube focus --jfly
  // clear up canvasFocused stuff...
  //$("#twistyContainer").addClass("canvasFocused");
  //$("#twistyContainer").removeClass("canvasFocused");

  $(window).keydown(function(e) {
    // This is kinda weird, we want to avoid turning the cube
    // if we're in a textarea, or input field.
    var focusedEl = document.activeElement.nodeName.toLowerCase();
    var isEditing = focusedEl == 'textarea' || focusedEl == 'input';
    if(isEditing) {
      return;
    }

    twistyScene.keydown(e);
  });
});

/*
 * Convenience Logging
 */

var logCounter = 0;

function log(obj) {
  console.log(obj);
  var previousHTML = $("#debug").html();
  previousHTML = (logCounter++) + ". " + obj + "<hr/>" + previousHTML;
  $("#debug").html(previousHTML);
}

function err(obj) {
  console.error(obj);
  var previousHTML = $("#debug").html();
  previousHTML = "<div class='err'>" + (logCounter++) + ". " + obj + "</div><hr/>" + previousHTML;
  $("#debug").html(previousHTML);
}

/*
 * Algs for testing
 */

var sune = [
[1, 1, "R", 1],
[1, 1, "U", 1],
[1, 1, "R", -1],
[1, 1, "U", 1],
[1, 1, "R", 1],
[1, 1, "U", 2],
[1, 1, "R", -1]
];
var ccc = [
[1, 1, "L", -1],
[1, 1, "U", 1],
[1, 1, "R", -1],
[1, 1, "F", -1],
[1, 1, "U", 1],
[1, 1, "L", -2],
[1, 1, "U", -2],
[1, 1, "L", -1],
[1, 1, "U", -1],
[1, 1, "L", 1],
[1, 1, "U", -2],
[1, 1, "D", 1],
[1, 1, "R", -1],
[1, 1, "D", -1],
[1, 1, "F", 2],
[1, 1, "R", 2],
[1, 1, "U", -1]
];
var ccc7 = [
[1, 1, "L", -1],
[1, 1, "U", 1],
[1, 1, "R", -1],
[1, 1, "F", -1],
[1, 1, "U", 1],
[1, 1, "L", -2],
[1, 1, "U", -2],
[1, 1, "L", -1],
[1, 1, "U", -1],
[1, 1, "L", 1],
[1, 1, "U", -2],
[1, 1, "D", 1],
[1, 1, "R", -1],
[1, 1, "D", -1],
[1, 1, "F", 2],
[1, 1, "R", 2],
[1, 1, "U", -1],
[1, 2, "L", -1],
[1, 2, "U", 1],
[1, 2, "R", -1],
[1, 2, "F", -1],
[1, 2, "U", 1],
[1, 2, "L", -2],
[1, 2, "U", -2],
[1, 2, "L", -1],
[1, 2, "U", -1],
[1, 2, "L", 1],
[1, 2, "U", -2],
[1, 2, "D", 1],
[1, 2, "R", -1],
[1, 2, "D", -1],
[1, 2, "F", 2],
[1, 2, "R", 2],
[1, 2, "U", -1],
[1, 3, "L", -1],
[1, 3, "U", 1],
[1, 3, "R", -1],
[1, 3, "F", -1],
[1, 3, "U", 1],
[1, 3, "L", -2],
[1, 3, "U", -2],
[1, 3, "L", -1],
[1, 3, "U", -1],
[1, 3, "L", 1],
[1, 3, "U", -2],
[1, 3, "D", 1],
[1, 3, "R", -1],
[1, 3, "D", -1],
[1, 3, "F", 2],
[1, 3, "R", 2],
[1, 3, "U", -1]
];
var layers = [
[1, 1, "R", 1],
[1, 1, "U", 1],
[1, 2, "R", 1],
[1, 2, "U", 1],
[1, 3, "R", 1],
[1, 3, "U", 1],
[1, 4, "R", 1],
[1, 4, "U", 1],
[1, 5, "R", 1],
[1, 5, "U", 1],
[2, 5, "R", 1],
[2, 5, "U", 1],
[3, 5, "R", 1],
[3, 5, "U", 1],
[4, 5, "R", 1],
[4, 5, "U", 1],
];
var lucasparity = [
[1, 2, "R", 1],
[1, 1, "U", 2],
[1, 4, "R", 1],
[1, 2, "R", 1],
[1, 1, "U", 2],
[1, 2, "R", 1],
[1, 1, "U", 2],
[1, 2, "R", -1],
[1, 1, "U", 2],
[1, 2, "L", 1],
[1, 1, "U", 2],
[1, 2, "R", -1],
[1, 1, "U", 2],
[1, 2, "R", 1],
[1, 1, "U", 2],
[1, 2, "R", -1],
[1, 1, "U", 2],
[1, 2, "R", -1]
];
var superflip = [
[2, 2, "R", 1],
[1, 1, "U", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[1, 3, "U", -1],
[1, 3, "R", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[1, 3, "U", -1],
[1, 3, "R", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[2, 2, "R", 1],
[1, 1, "U", -1],
[1, 3, "U", -1],
[1, 3, "R", -1],
];

function makeCCC(n) {

  var cccMoves = [];

  for (var i = 1; i<=n/2; i++) {
    var moreMoves = [
[1, i, "L", -1],
[1, i, "U", 1],
[1, i, "R", -1],
[1, i, "F", -1],
[1, i, "U", 1],
[1, i, "L", -2],
[1, i, "U", -2],
[1, i, "L", -1],
[1, i, "U", -1],
[1, i, "L", 1],
[1, i, "U", -2],
[1, i, "D", 1],
[1, i, "R", -1],
[1, i, "D", -1],
[1, i, "F", 2],
[1, i, "R", 2],
[1, i, "U", -1]
];

    cccMoves = cccMoves.concat(moreMoves);
  }

  return cccMoves;

}
