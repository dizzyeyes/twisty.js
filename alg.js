
var alg = (function (){

  var debug = false;

  var patterns = {
    single: /^[UFRBLD]$/,
    wide: /^([ufrbld])|([UFRBLD]w)$/,
    slice: /^[MNES]$/,
    rotation: /^[xyz]$/,
    pause: /^\.$/
  };

  function moveKind(moveString) {
    for (s in patterns) {
      if (patterns[s].test(moveString)) {
        return s;
      }
    }
    return "UNKNOWN";
  }

  var directionMap = {
    "U": "U", "Uw": "U", "u": "U",           "y": "U",
    "F": "F", "Fw": "F", "f": "F", "S": "F", "z": "F",
    "R": "R", "Rw": "R", "r": "R", "N": "R", "x": "R",
    "B": "B", "Bw": "B", "b": "B",
    "L": "L", "Lw": "L", "l": "L", "M": "L",
    "D": "D", "Dw": "D", "d": "D", "E": "D",
    ".": "."
  };

  function canonicalizeMove(orig, dimension) {
    var move = {};

    move.amount = orig.amount;
    move.base = directionMap[orig.base];

    if (patterns.single.test(orig.base)) {
      move.startLayer = orig.layer || 1;
      move.endLayer = move.startLayer;
    } else if (patterns.wide.test(orig.base)) {
      move.startLayer = orig.startLayer || 1;
      move.endLayer = orig.endLayer || 2;
    } else if (patterns.slice.test(orig.base)) {
      move.startLayer = 2;
      move.endLayer = dimension - 1;
    } else if (patterns.rotation.test(orig.base)) {
      move.startLayer = 1;
      move.endLayer = dimension;
    }

    return move;
  }

  var cube = (function(){



    var types = {
      sequence:      {repeatable: false},
      move:          {repeatable: true },
      commutator:    {repeatable: true },
      conjugate:     {repeatable: true },
      group:         {repeatable: true },
      pause:         {repeatable: false},
      newline:       {repeatable: false},
      comment_short: {repeatable: false},
      comment_long:  {repeatable: false},
      timestamp:     {repeatable: false}
    }



    /************************************************************************************************/



    function fromString(algString) {
      return alg_jison.parse(algString);
    }



    // TODO: Document that it is not safe to mutate algs, because they may share moves.
    function cloneMove(move) {
      var newMove = {};
      for (i in move) {
        newMove[i] = move[i]
      }
      return newMove;
    }



   /************************************************************************************************/


    function suffix(repeated) {

      if (typeof repeated.amount === "undefined") {
        throw "Amount not defined for repeatable: ", repeated
      }

      var amount = Math.abs(repeated.amount);
      var amountDir = (repeated.amount > 0) ? 1 : -1; // Mutable

      var suffix = ""
      // Suffix Logic
      if (amount > 1) {
        suffix += "" + amount;
      }

      if (amountDir === -1) {
        suffix += "'";
      }
      return suffix;
    }


    /****************************************************************/


    function toString(alg, dimension) {

      var moveStrings = [];
      for (var i = 0; i < alg.length; i++) {
        var type = alg[i].type;
        var moveString = toString[type](alg[i]);
        if (types[type].repeatable) {
          moveString += suffix(alg[i]);
        }
        moveStrings.push(moveString);

        var lastMove = (i == alg.length - 1);
        var afterNewline = (alg[i].type === "newline");
        var beforeNewline = ((i + 1) in alg && alg[i + 1].type === "newline");
        var betweenPauses = ((i + 1) in alg && alg[i].type === "pause" && alg[i + 1].type === "pause");

        if (!lastMove && !afterNewline && !beforeNewline && !betweenPauses) {
          moveStrings.push(" ");
        }
      }
      return moveStrings.join("");
    }

    toString.move = function(move) {
        var tL = move.layer;
        var sL = move.startLayer;
        var oL = move.endLayer;

        var prefix = "";

        // Prefix logic
        if (patterns.single.test(move.base)) {
          if (move.layer) {
            prefix = move.layer.toString();
          }
        } else if (patterns.wide.test(move.base)) {
          if (move.endLayer) {
            prefix = move.endLayer.toString();
            if (move.startLayer) {
              prefix = move.startLayer.toString() + "-" + prefix;
            }
          }
        }

        return prefix + move.base;
    }

    toString.commutator = function(commutator) {
      return "[" + toString(commutator.A) + ", " + toString(commutator.B) + "]";
    }

    toString.conjugate = function(conjugate) {
      return "[" + toString(conjugate.A) + ": " + toString(conjugate.B) + "]";
    }

    toString.group = function(group) {
      return "(" + toString(group.A) + ")";
    }

    toString.timestamp = function(timestamp) {
      return "@" + timestamp.time + "s";
    }

    toString.comment_short = function(comment_short) {
      return comment_short.comment;
    }

    toString.comment_long = function(comment_long) {
      return comment_long.comment;
    }

    toString.pause = function(pause) {
      return ".";
    }

    toString.newline = function(newline) {
      return "\n";
    }



    /************************************************************************************************/



    // From twisty.js.
    function getOptions(input, defaults) {
      var output = {};
      for (var key in defaults) {
        output[key] = (key in input) ? input[key] : defaults[key];
      }
      return output;
    }


    /****************************************************************/


    // Dispatch mechanism constructor.
    function makeAlgTraversal(options) {

      options = getOptions(options || {}, {
        outputIsAlg: true,
        inputValidator: function(){return true;}
      });

      var fn = function(alg, data) {
        var stringInput = (typeof alg === "string");
        if (stringInput) {alg = fromString(alg);}

        if (!options.inputValidator(alg, data)) {
          throw "Validation failed."
        }

        var output = fn.sequence(alg, data);
        if (stringInput && options.outputIsAlg) {output = toString(output);}

        return output;
      }

      fn.sequence = function(algIn, data) {
        var moves = [];
        for (var i = 0; i < algIn.length; i++) {
          moves = moves.concat(fn[algIn[i].type](algIn[i], data));
        }
        return moves;
      };

      fn.move = function(move, data) {
        return move;
      }

      fn.commutator = function(commutator, data) {
        return {
          "type": "commutator",
          "A": fn(commutator.A, data),
          "B": fn(commutator.B, data),
          "amount": commutator.amount
        };
      }

      fn.conjugate = function(conjugate, data) {
        return {
          "type": "conjugate",
          "A": fn(conjugate.A, data),
          "B": fn(conjugate.B, data),
          "amount": conjugate.amount
        };
      }

      fn.group = function(group, data) {
        return {
          "type": "group",
          "A": fn(group.A, data),
          "amount": group.amount
        };
      }

      var id = function(x) {return x;};

      fn.pause = id;
      fn.newline = id;
      fn.comment_short = id;
      fn.comment_long = id;
      fn.timestamp = id;

      // Make the defaults available to overrides.
      // TODO: Use prototypes?
      for (i in fn) {
        fn["_" + i] = fn[i];
      }

      return fn;
    }



    /************************************************************************************************/


    function round(x) {
      // We want to round:
      //    2.6 to  3
      //    2.5 to  2
      //   -2.5 to -2
      var antiSignish = x < 0 ? 1 : -1; // When can we haz ES6?
      return Math.round(-Math.abs(x)) * antiSignish;
    }


    /****************************************************************/


    var simplify = makeAlgTraversal();

    simplify.sequence = function(sequence) {
      var algOut = [];
      for (var i = 0; i < sequence.length; i++) {
        var move = sequence[i];
        if (move.type !== "move") {
          algOut.push(simplify[move.type](move));
        }
        else if (algOut.length > 0 &&
            algOut[algOut.length-1].startLayer == move.startLayer &&
            algOut[algOut.length-1].endLayer == move.endLayer &&
            algOut[algOut.length-1].base == move.base) {
          var amount = algOut[algOut.length-1].amount + move.amount;
          // Mod to [-2, -1, 0, 1, 2]
          // x | 0 truncates x towards 0.
          amount = amount - 4 * round(amount / 4);
          if (amount == 0) {
            algOut.pop();
          }
          else {
            algOut[algOut.length-1].amount = amount;
          }
        }
        else {
          algOut.push(cloneMove(move));
        }
        //console.log(JSON.stringify(algOut));
      }
      console.log(algOut);
      return algOut;
    }



    /************************************************************************************************/



    function repeatMoves(movesIn, accordingTo) {

      var movesOnce = movesIn;

      var amount = Math.abs(accordingTo.amount);
      var amountDir = (accordingTo.amount > 0) ? 1 : -1; // Mutable

      if (amountDir == -1) {
        movesOnce = invert(movesOnce);
      }

      var movesOut = [];
      for (var i = 0; i < amount; i++) {
        movesOut = movesOut.concat(movesOnce);
      }

      return movesOut;
    }


    /****************************************************************/


    var expand = makeAlgTraversal();

    expand.commutator = function(commutator) {
      var once = [].concat(
        expand(commutator.A),
        expand(commutator.B),
        invert(expand(commutator.A)),
        invert(expand(commutator.B))
      );
      return repeatMoves(once, commutator);
    }

    expand.conjugate = function(conjugate) {
      var once = [].concat(
        expand(conjugate.A),
        expand(conjugate.B),
        invert(expand(conjugate.A))
      );
      return repeatMoves(once, conjugate);
    }

    expand.group = function(group) {
      var once = toMoves(group.A);
      return repeatMoves(once, group);
    }


    /****************************************************************/



    var toMoves = makeAlgTraversal();

    toMoves.commutator = expand.commutator;
    toMoves.conjugate = expand.conjugate;
    toMoves.group = expand.group;

    var emptySequence = function(timestamp) {return [];}

    // TODO: Allow handling semantic data in addition to pure moves during animation.
    toMoves.pause = function(pause) {
      return {
        "type": "move",
        "base": ".",
        "amount": 1,
        "location": pause.location
      };
    };
    toMoves.newline = emptySequence;
    toMoves.comment_short = emptySequence;
    toMoves.comment_long = emptySequence;
    toMoves.timestamp = emptySequence;



    /************************************************************************************************/



    var invert = makeAlgTraversal();

    invert.sequence = function(sequence) {
      var currentLine;
      var lines = [currentLine = []];
      for (var i = 0; i < sequence.length; i++) {
        if (sequence[i].type == "newline") {
          lines.push(currentLine = []);
        }
        else {
          currentLine.push(invert[sequence[i].type](sequence[i]));
        }
      }
      var out = [];
      for (var i = lines.length - 1; i >= 0; i--) {
        lines[i].reverse()
        if (lines[i].length > 0 && lines[i][0].type == "comment_short") {
          var comment = lines[i].splice(0, 1)[0];
          lines[i].push(comment);
        }
        if (i > 0) {
          lines[i].push({type: "newline"});
        }
        out = out.concat(lines[i]);
      }
      return out;
    }

    invert.move = function(move) {
      var invertedMove = cloneMove(move);
      if (move.base !== ".") {
        invertedMove.amount = -invertedMove.amount;
      }
      return invertedMove;
    }

    invert.commutator = function(commutator) {
      return {
        "type": "commutator",
        "A": commutator.B,
        "B": commutator.A,
        "amount": commutator.amount
      };
    }

    invert.conjugate = function(conjugate) {
      return {
        "type": "conjugate",
        "A": conjugate.A,
        "B": invert(conjugate.B),
        "amount": conjugate.amount
      };
    }

    invert.group = function(group) {
      return {
        "type": "group",
        "A": invert(group.A),
        "amount": group.amount
      };
    }

    // TODO: Reversing timestamps properly takes more work.
    toMoves.timestamp = function(timestamp) {
      return [];
    }



    /************************************************************************************************/



    var mirrorM = {
      fixed: ["x", "M", "N"],
      sliceMap: {
        "U": "U", "Uw": "Uw", "u": "u",           "y": "y",
        "F": "F", "Fw": "Fw", "f": "f", "S": "S", "z": "z",
        "R": "L", "Rw": "Lw", "r": "l", "N": "N", "x": "x",
        "B": "B", "Bw": "Bw", "b": "b",
        "L": "R", "Lw": "Rw", "l": "r", "M": "M",
        "D": "D", "Dw": "Dw", "d": "d", "E": "E"
      }
    };


    var mirrorS = {
      fixed: ["z", "S"],
      sliceMap: {
        "U": "U", "Uw": "Uw", "u": "u",           "y": "y",
        "F": "B", "Fw": "Bw", "f": "b", "S": "S", "z": "z",
        "R": "R", "Rw": "Rw", "r": "r", "N": "N", "x": "x",
        "B": "F", "Fw": "Fw", "b": "f",
        "L": "L", "Lw": "Lw", "l": "l", "M": "M",
        "D": "D", "Dw": "Dw", "d": "d", "E": "E"
      }
    };


    /****************************************************************/


    var mirrorAcrossM = makeAlgTraversal();

    mirrorAcrossM.move = function(move) {
      var mirroredMove = cloneMove(move);
      if (mirrorM.fixed.indexOf(mirroredMove.base) === -1) {
        mirroredMove.base = mirrorM.sliceMap[mirroredMove.base];
        mirroredMove.amount = -mirroredMove.amount;
      }
      return mirroredMove;
    }


    var mirrorAcrossS = makeAlgTraversal();

    mirrorAcrossS.move = function(move) {
      var mirroredMove = cloneMove(move);
      if (mirrorS.fixed.indexOf(mirroredMove.base) === -1) {
        mirroredMove.base = mirrorS.sliceMap[mirroredMove.base];
        mirroredMove.amount = -mirroredMove.amount;
      }
      return mirroredMove;
    }




    /************************************************************************************************/

    // Metrics


    var moveCountScalars = {
       "obtm": {rotation: [0, 0], outer: [1, 0], inner: [2, 0]},
        "btm": {rotation: [0, 0], outer: [1, 0], inner: [1, 0]},
      "obqtm": {rotation: [0, 0], outer: [0, 1], inner: [0, 2]},
        "etm": {rotation: [1, 0], outer: [1, 0], inner: [1, 0]}
    }

    function moveScale(amount, scalars) {
      if (amount == 0) {
        return 0; //TODO: ETM?
      }
      return scalars[0] + Math.abs(amount) * scalars[1];
    }

    var add = function(a, b) {
      return a + b;
    };

    var arraySum = function(arr) {
      return arr.reduce(add, 0);
    }


    function countMovesValidator(alg, data) {
      if (!data.metric) {
        console.error("No metric given. Valid options: " + Object.keys(moveCountScalars).join(", "));
        return false;
      }
      if (!(data.metric in moveCountScalars)) {
        console.error("Invalid metric. Valid options: " + Object.keys(moveCountScalars).join(", "));
        return false;
      }
      if (!data.dimension) {
        console.error("No dimension given.");
        return false;
      }
      return true;
    }



    /****************************************************************/



    // Example: alg.cube.countMoves("R", {metric: "obtm", dimension: 3})
    // TODO: Default to obtm and 3x3x3.
    // TODO: Dimension independence?

    var countMoves = makeAlgTraversal({
      outputIsAlg: false,
      inputValidator: countMovesValidator
    });

    countMoves.sequence = function(move, data) {
      var counts = countMoves._sequence(move, data);
      return arraySum(counts);
    }

    countMoves.move = function(move, data) {
      var can = canonicalizeMove(move, data.dimension);

      var scalarKind;
      if (can.startLayer === 1 && can.endLayer === data.dimension) {
        scalarKind = "rotation";
      } else if (can.startLayer === 1 || can.endLayer === data.dimension) {
        scalarKind = "outer";
      } else if (1 < can.startLayer && can.startLayer <= can.endLayer && can.endLayer < data.dimension) {
        scalarKind = "inner";
      } else {
        throw "Unkown move.";
      }
      var scalars = moveCountScalars[data.metric][scalarKind];
      return moveScale(can.amount, scalars);
    }

    countMoves.commutator = function(commutator, data) {
      // TODO: map/reduce framework for structural recursion?
      var counts = countMoves._commutator(commutator, data);
      return (counts.A * 2 + counts.B * 2) * Math.abs(counts.amount);
    }

    countMoves.conjugate = function(conjugate, data) {
      var counts = countMoves._conjugate(conjugate, data);
      return (counts.A * 2 + counts.B * 1) * Math.abs(counts.amount);
    }

    countMoves.group = function(group, data) {
      var counts = countMoves._group(group, data);
      return (counts.A) * Math.abs(counts.amount);
    }

    var zero = function(group, data) {
      return 0;
    }

    countMoves.pause = zero;
    countMoves.newline = zero;
    countMoves.comment_short = zero;
    countMoves.comment_long = zero;
    countMoves.timestamp = zero;


    /************************************************************************************************/

    // Exports

    return {
      toString: toString,
      simplify: simplify,
      fromString: fromString,
      makeAlgTraversal: makeAlgTraversal,
      invert: invert,
      mirrorAcrossM: mirrorAcrossM,
      mirrorAcrossS: mirrorAcrossS,
      canonicalizeMove: canonicalizeMove,
      toMoves: toMoves,
      expand: expand,
      countMoves: countMoves
    }
  })();

  return {
    cube: cube
  }
})();
