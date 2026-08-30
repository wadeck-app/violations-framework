#!/usr/bin/env node
const __importMetaUrl = require('node:url').pathToFileURL(__filename).href;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/braces/lib/utils.js
var require_utils = __commonJS({
  "../../node_modules/braces/lib/utils.js"(exports2) {
    "use strict";
    exports2.isInteger = (num) => {
      if (typeof num === "number") {
        return Number.isInteger(num);
      }
      if (typeof num === "string" && num.trim() !== "") {
        return Number.isInteger(Number(num));
      }
      return false;
    };
    exports2.find = (node, type) => node.nodes.find((node2) => node2.type === type);
    exports2.exceedsLimit = (min, max, step = 1, limit) => {
      if (limit === false) return false;
      if (!exports2.isInteger(min) || !exports2.isInteger(max)) return false;
      return (Number(max) - Number(min)) / Number(step) >= limit;
    };
    exports2.escapeNode = (block, n = 0, type) => {
      const node = block.nodes[n];
      if (!node) return;
      if (type && node.type === type || node.type === "open" || node.type === "close") {
        if (node.escaped !== true) {
          node.value = "\\" + node.value;
          node.escaped = true;
        }
      }
    };
    exports2.encloseBrace = (node) => {
      if (node.type !== "brace") return false;
      if (node.commas >> 0 + node.ranges >> 0 === 0) {
        node.invalid = true;
        return true;
      }
      return false;
    };
    exports2.isInvalidBrace = (block) => {
      if (block.type !== "brace") return false;
      if (block.invalid === true || block.dollar) return true;
      if (block.commas >> 0 + block.ranges >> 0 === 0) {
        block.invalid = true;
        return true;
      }
      if (block.open !== true || block.close !== true) {
        block.invalid = true;
        return true;
      }
      return false;
    };
    exports2.isOpenOrClose = (node) => {
      if (node.type === "open" || node.type === "close") {
        return true;
      }
      return node.open === true || node.close === true;
    };
    exports2.reduce = (nodes) => nodes.reduce((acc, node) => {
      if (node.type === "text") acc.push(node.value);
      if (node.type === "range") node.type = "text";
      return acc;
    }, []);
    exports2.flatten = (...args) => {
      const result = [];
      const flat = (arr) => {
        for (let i = 0; i < arr.length; i++) {
          const ele = arr[i];
          if (Array.isArray(ele)) {
            flat(ele);
            continue;
          }
          if (ele !== void 0) {
            result.push(ele);
          }
        }
        return result;
      };
      flat(args);
      return result;
    };
  }
});

// ../../node_modules/braces/lib/stringify.js
var require_stringify = __commonJS({
  "../../node_modules/braces/lib/stringify.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    module2.exports = (ast, options = {}) => {
      const stringify = (node, parent = {}) => {
        const invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
        const invalidNode = node.invalid === true && options.escapeInvalid === true;
        let output = "";
        if (node.value) {
          if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
            return "\\" + node.value;
          }
          return node.value;
        }
        if (node.value) {
          return node.value;
        }
        if (node.nodes) {
          for (const child of node.nodes) {
            output += stringify(child);
          }
        }
        return output;
      };
      return stringify(ast);
    };
  }
});

// ../../node_modules/is-number/index.js
var require_is_number = __commonJS({
  "../../node_modules/is-number/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function(num) {
      if (typeof num === "number") {
        return num - num === 0;
      }
      if (typeof num === "string" && num.trim() !== "") {
        return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
      }
      return false;
    };
  }
});

// ../../node_modules/to-regex-range/index.js
var require_to_regex_range = __commonJS({
  "../../node_modules/to-regex-range/index.js"(exports2, module2) {
    "use strict";
    var isNumber = require_is_number();
    var toRegexRange = (min, max, options) => {
      if (isNumber(min) === false) {
        throw new TypeError("toRegexRange: expected the first argument to be a number");
      }
      if (max === void 0 || min === max) {
        return String(min);
      }
      if (isNumber(max) === false) {
        throw new TypeError("toRegexRange: expected the second argument to be a number.");
      }
      let opts = { relaxZeros: true, ...options };
      if (typeof opts.strictZeros === "boolean") {
        opts.relaxZeros = opts.strictZeros === false;
      }
      let relax = String(opts.relaxZeros);
      let shorthand = String(opts.shorthand);
      let capture = String(opts.capture);
      let wrap = String(opts.wrap);
      let cacheKey = min + ":" + max + "=" + relax + shorthand + capture + wrap;
      if (toRegexRange.cache.hasOwnProperty(cacheKey)) {
        return toRegexRange.cache[cacheKey].result;
      }
      let a = Math.min(min, max);
      let b = Math.max(min, max);
      if (Math.abs(a - b) === 1) {
        let result = min + "|" + max;
        if (opts.capture) {
          return `(${result})`;
        }
        if (opts.wrap === false) {
          return result;
        }
        return `(?:${result})`;
      }
      let isPadded = hasPadding(min) || hasPadding(max);
      let state = { min, max, a, b };
      let positives = [];
      let negatives = [];
      if (isPadded) {
        state.isPadded = isPadded;
        state.maxLen = String(state.max).length;
      }
      if (a < 0) {
        let newMin = b < 0 ? Math.abs(b) : 1;
        negatives = splitToPatterns(newMin, Math.abs(a), state, opts);
        a = state.a = 0;
      }
      if (b >= 0) {
        positives = splitToPatterns(a, b, state, opts);
      }
      state.negatives = negatives;
      state.positives = positives;
      state.result = collatePatterns(negatives, positives, opts);
      if (opts.capture === true) {
        state.result = `(${state.result})`;
      } else if (opts.wrap !== false && positives.length + negatives.length > 1) {
        state.result = `(?:${state.result})`;
      }
      toRegexRange.cache[cacheKey] = state;
      return state.result;
    };
    function collatePatterns(neg, pos, options) {
      let onlyNegative = filterPatterns(neg, pos, "-", false, options) || [];
      let onlyPositive = filterPatterns(pos, neg, "", false, options) || [];
      let intersected = filterPatterns(neg, pos, "-?", true, options) || [];
      let subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
      return subpatterns.join("|");
    }
    function splitToRanges(min, max) {
      let nines = 1;
      let zeros = 1;
      let stop = countNines(min, nines);
      let stops = /* @__PURE__ */ new Set([max]);
      while (min <= stop && stop <= max) {
        stops.add(stop);
        nines += 1;
        stop = countNines(min, nines);
      }
      stop = countZeros(max + 1, zeros) - 1;
      while (min < stop && stop <= max) {
        stops.add(stop);
        zeros += 1;
        stop = countZeros(max + 1, zeros) - 1;
      }
      stops = [...stops];
      stops.sort(compare);
      return stops;
    }
    function rangeToPattern(start, stop, options) {
      if (start === stop) {
        return { pattern: start, count: [], digits: 0 };
      }
      let zipped = zip(start, stop);
      let digits = zipped.length;
      let pattern = "";
      let count = 0;
      for (let i = 0; i < digits; i++) {
        let [startDigit, stopDigit] = zipped[i];
        if (startDigit === stopDigit) {
          pattern += startDigit;
        } else if (startDigit !== "0" || stopDigit !== "9") {
          pattern += toCharacterClass(startDigit, stopDigit, options);
        } else {
          count++;
        }
      }
      if (count) {
        pattern += options.shorthand === true ? "\\d" : "[0-9]";
      }
      return { pattern, count: [count], digits };
    }
    function splitToPatterns(min, max, tok, options) {
      let ranges = splitToRanges(min, max);
      let tokens = [];
      let start = min;
      let prev;
      for (let i = 0; i < ranges.length; i++) {
        let max2 = ranges[i];
        let obj = rangeToPattern(String(start), String(max2), options);
        let zeros = "";
        if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
          if (prev.count.length > 1) {
            prev.count.pop();
          }
          prev.count.push(obj.count[0]);
          prev.string = prev.pattern + toQuantifier(prev.count);
          start = max2 + 1;
          continue;
        }
        if (tok.isPadded) {
          zeros = padZeros(max2, tok, options);
        }
        obj.string = zeros + obj.pattern + toQuantifier(obj.count);
        tokens.push(obj);
        start = max2 + 1;
        prev = obj;
      }
      return tokens;
    }
    function filterPatterns(arr, comparison, prefix, intersection, options) {
      let result = [];
      for (let ele of arr) {
        let { string } = ele;
        if (!intersection && !contains(comparison, "string", string)) {
          result.push(prefix + string);
        }
        if (intersection && contains(comparison, "string", string)) {
          result.push(prefix + string);
        }
      }
      return result;
    }
    function zip(a, b) {
      let arr = [];
      for (let i = 0; i < a.length; i++) arr.push([a[i], b[i]]);
      return arr;
    }
    function compare(a, b) {
      return a > b ? 1 : b > a ? -1 : 0;
    }
    function contains(arr, key, val) {
      return arr.some((ele) => ele[key] === val);
    }
    function countNines(min, len) {
      return Number(String(min).slice(0, -len) + "9".repeat(len));
    }
    function countZeros(integer, zeros) {
      return integer - integer % Math.pow(10, zeros);
    }
    function toQuantifier(digits) {
      let [start = 0, stop = ""] = digits;
      if (stop || start > 1) {
        return `{${start + (stop ? "," + stop : "")}}`;
      }
      return "";
    }
    function toCharacterClass(a, b, options) {
      return `[${a}${b - a === 1 ? "" : "-"}${b}]`;
    }
    function hasPadding(str) {
      return /^-?(0+)\d/.test(str);
    }
    function padZeros(value, tok, options) {
      if (!tok.isPadded) {
        return value;
      }
      let diff = Math.abs(tok.maxLen - String(value).length);
      let relax = options.relaxZeros !== false;
      switch (diff) {
        case 0:
          return "";
        case 1:
          return relax ? "0?" : "0";
        case 2:
          return relax ? "0{0,2}" : "00";
        default: {
          return relax ? `0{0,${diff}}` : `0{${diff}}`;
        }
      }
    }
    toRegexRange.cache = {};
    toRegexRange.clearCache = () => toRegexRange.cache = {};
    module2.exports = toRegexRange;
  }
});

// ../../node_modules/fill-range/index.js
var require_fill_range = __commonJS({
  "../../node_modules/fill-range/index.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var toRegexRange = require_to_regex_range();
    var isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    var transform = (toNumber) => {
      return (value) => toNumber === true ? Number(value) : String(value);
    };
    var isValidValue = (value) => {
      return typeof value === "number" || typeof value === "string" && value !== "";
    };
    var isNumber = (num) => Number.isInteger(+num);
    var zeros = (input) => {
      let value = `${input}`;
      let index = -1;
      if (value[0] === "-") value = value.slice(1);
      if (value === "0") return false;
      while (value[++index] === "0") ;
      return index > 0;
    };
    var stringify = (start, end, options) => {
      if (typeof start === "string" || typeof end === "string") {
        return true;
      }
      return options.stringify === true;
    };
    var pad = (input, maxLength, toNumber) => {
      if (maxLength > 0) {
        let dash = input[0] === "-" ? "-" : "";
        if (dash) input = input.slice(1);
        input = dash + input.padStart(dash ? maxLength - 1 : maxLength, "0");
      }
      if (toNumber === false) {
        return String(input);
      }
      return input;
    };
    var toMaxLen = (input, maxLength) => {
      let negative = input[0] === "-" ? "-" : "";
      if (negative) {
        input = input.slice(1);
        maxLength--;
      }
      while (input.length < maxLength) input = "0" + input;
      return negative ? "-" + input : input;
    };
    var toSequence = (parts, options, maxLen) => {
      parts.negatives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
      parts.positives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
      let prefix = options.capture ? "" : "?:";
      let positives = "";
      let negatives = "";
      let result;
      if (parts.positives.length) {
        positives = parts.positives.map((v) => toMaxLen(String(v), maxLen)).join("|");
      }
      if (parts.negatives.length) {
        negatives = `-(${prefix}${parts.negatives.map((v) => toMaxLen(String(v), maxLen)).join("|")})`;
      }
      if (positives && negatives) {
        result = `${positives}|${negatives}`;
      } else {
        result = positives || negatives;
      }
      if (options.wrap) {
        return `(${prefix}${result})`;
      }
      return result;
    };
    var toRange = (a, b, isNumbers, options) => {
      if (isNumbers) {
        return toRegexRange(a, b, { wrap: false, ...options });
      }
      let start = String.fromCharCode(a);
      if (a === b) return start;
      let stop = String.fromCharCode(b);
      return `[${start}-${stop}]`;
    };
    var toRegex = (start, end, options) => {
      if (Array.isArray(start)) {
        let wrap = options.wrap === true;
        let prefix = options.capture ? "" : "?:";
        return wrap ? `(${prefix}${start.join("|")})` : start.join("|");
      }
      return toRegexRange(start, end, options);
    };
    var rangeError = (...args) => {
      return new RangeError("Invalid range arguments: " + util.inspect(...args));
    };
    var invalidRange = (start, end, options) => {
      if (options.strictRanges === true) throw rangeError([start, end]);
      return [];
    };
    var invalidStep = (step, options) => {
      if (options.strictRanges === true) {
        throw new TypeError(`Expected step "${step}" to be a number`);
      }
      return [];
    };
    var fillNumbers = (start, end, step = 1, options = {}) => {
      let a = Number(start);
      let b = Number(end);
      if (!Number.isInteger(a) || !Number.isInteger(b)) {
        if (options.strictRanges === true) throw rangeError([start, end]);
        return [];
      }
      if (a === 0) a = 0;
      if (b === 0) b = 0;
      let descending = a > b;
      let startString = String(start);
      let endString = String(end);
      let stepString = String(step);
      step = Math.max(Math.abs(step), 1);
      let padded = zeros(startString) || zeros(endString) || zeros(stepString);
      let maxLen = padded ? Math.max(startString.length, endString.length, stepString.length) : 0;
      let toNumber = padded === false && stringify(start, end, options) === false;
      let format = options.transform || transform(toNumber);
      if (options.toRegex && step === 1) {
        return toRange(toMaxLen(start, maxLen), toMaxLen(end, maxLen), true, options);
      }
      let parts = { negatives: [], positives: [] };
      let push = (num) => parts[num < 0 ? "negatives" : "positives"].push(Math.abs(num));
      let range = [];
      let index = 0;
      while (descending ? a >= b : a <= b) {
        if (options.toRegex === true && step > 1) {
          push(a);
        } else {
          range.push(pad(format(a, index), maxLen, toNumber));
        }
        a = descending ? a - step : a + step;
        index++;
      }
      if (options.toRegex === true) {
        return step > 1 ? toSequence(parts, options, maxLen) : toRegex(range, null, { wrap: false, ...options });
      }
      return range;
    };
    var fillLetters = (start, end, step = 1, options = {}) => {
      if (!isNumber(start) && start.length > 1 || !isNumber(end) && end.length > 1) {
        return invalidRange(start, end, options);
      }
      let format = options.transform || ((val) => String.fromCharCode(val));
      let a = `${start}`.charCodeAt(0);
      let b = `${end}`.charCodeAt(0);
      let descending = a > b;
      let min = Math.min(a, b);
      let max = Math.max(a, b);
      if (options.toRegex && step === 1) {
        return toRange(min, max, false, options);
      }
      let range = [];
      let index = 0;
      while (descending ? a >= b : a <= b) {
        range.push(format(a, index));
        a = descending ? a - step : a + step;
        index++;
      }
      if (options.toRegex === true) {
        return toRegex(range, null, { wrap: false, options });
      }
      return range;
    };
    var fill = (start, end, step, options = {}) => {
      if (end == null && isValidValue(start)) {
        return [start];
      }
      if (!isValidValue(start) || !isValidValue(end)) {
        return invalidRange(start, end, options);
      }
      if (typeof step === "function") {
        return fill(start, end, 1, { transform: step });
      }
      if (isObject(step)) {
        return fill(start, end, 0, step);
      }
      let opts = { ...options };
      if (opts.capture === true) opts.wrap = true;
      step = step || opts.step || 1;
      if (!isNumber(step)) {
        if (step != null && !isObject(step)) return invalidStep(step, opts);
        return fill(start, end, 1, step);
      }
      if (isNumber(start) && isNumber(end)) {
        return fillNumbers(start, end, step, opts);
      }
      return fillLetters(start, end, Math.max(Math.abs(step), 1), opts);
    };
    module2.exports = fill;
  }
});

// ../../node_modules/braces/lib/compile.js
var require_compile = __commonJS({
  "../../node_modules/braces/lib/compile.js"(exports2, module2) {
    "use strict";
    var fill = require_fill_range();
    var utils = require_utils();
    var compile = (ast, options = {}) => {
      const walk2 = (node, parent = {}) => {
        const invalidBlock = utils.isInvalidBrace(parent);
        const invalidNode = node.invalid === true && options.escapeInvalid === true;
        const invalid = invalidBlock === true || invalidNode === true;
        const prefix = options.escapeInvalid === true ? "\\" : "";
        let output = "";
        if (node.isOpen === true) {
          return prefix + node.value;
        }
        if (node.isClose === true) {
          console.log("node.isClose", prefix, node.value);
          return prefix + node.value;
        }
        if (node.type === "open") {
          return invalid ? prefix + node.value : "(";
        }
        if (node.type === "close") {
          return invalid ? prefix + node.value : ")";
        }
        if (node.type === "comma") {
          return node.prev.type === "comma" ? "" : invalid ? node.value : "|";
        }
        if (node.value) {
          return node.value;
        }
        if (node.nodes && node.ranges > 0) {
          const args = utils.reduce(node.nodes);
          const range = fill(...args, { ...options, wrap: false, toRegex: true, strictZeros: true });
          if (range.length !== 0) {
            return args.length > 1 && range.length > 1 ? `(${range})` : range;
          }
        }
        if (node.nodes) {
          for (const child of node.nodes) {
            output += walk2(child, node);
          }
        }
        return output;
      };
      return walk2(ast);
    };
    module2.exports = compile;
  }
});

// ../../node_modules/braces/lib/expand.js
var require_expand = __commonJS({
  "../../node_modules/braces/lib/expand.js"(exports2, module2) {
    "use strict";
    var fill = require_fill_range();
    var stringify = require_stringify();
    var utils = require_utils();
    var append = (queue = "", stash = "", enclose = false) => {
      const result = [];
      queue = [].concat(queue);
      stash = [].concat(stash);
      if (!stash.length) return queue;
      if (!queue.length) {
        return enclose ? utils.flatten(stash).map((ele) => `{${ele}}`) : stash;
      }
      for (const item of queue) {
        if (Array.isArray(item)) {
          for (const value of item) {
            result.push(append(value, stash, enclose));
          }
        } else {
          for (let ele of stash) {
            if (enclose === true && typeof ele === "string") ele = `{${ele}}`;
            result.push(Array.isArray(ele) ? append(item, ele, enclose) : item + ele);
          }
        }
      }
      return utils.flatten(result);
    };
    var expand = (ast, options = {}) => {
      const rangeLimit = options.rangeLimit === void 0 ? 1e3 : options.rangeLimit;
      const walk2 = (node, parent = {}) => {
        node.queue = [];
        let p = parent;
        let q = parent.queue;
        while (p.type !== "brace" && p.type !== "root" && p.parent) {
          p = p.parent;
          q = p.queue;
        }
        if (node.invalid || node.dollar) {
          q.push(append(q.pop(), stringify(node, options)));
          return;
        }
        if (node.type === "brace" && node.invalid !== true && node.nodes.length === 2) {
          q.push(append(q.pop(), ["{}"]));
          return;
        }
        if (node.nodes && node.ranges > 0) {
          const args = utils.reduce(node.nodes);
          if (utils.exceedsLimit(...args, options.step, rangeLimit)) {
            throw new RangeError("expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.");
          }
          let range = fill(...args, options);
          if (range.length === 0) {
            range = stringify(node, options);
          }
          q.push(append(q.pop(), range));
          node.nodes = [];
          return;
        }
        const enclose = utils.encloseBrace(node);
        let queue = node.queue;
        let block = node;
        while (block.type !== "brace" && block.type !== "root" && block.parent) {
          block = block.parent;
          queue = block.queue;
        }
        for (let i = 0; i < node.nodes.length; i++) {
          const child = node.nodes[i];
          if (child.type === "comma" && node.type === "brace") {
            if (i === 1) queue.push("");
            queue.push("");
            continue;
          }
          if (child.type === "close") {
            q.push(append(q.pop(), queue, enclose));
            continue;
          }
          if (child.value && child.type !== "open") {
            queue.push(append(queue.pop(), child.value));
            continue;
          }
          if (child.nodes) {
            walk2(child, node);
          }
        }
        return queue;
      };
      return utils.flatten(walk2(ast));
    };
    module2.exports = expand;
  }
});

// ../../node_modules/braces/lib/constants.js
var require_constants = __commonJS({
  "../../node_modules/braces/lib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      MAX_LENGTH: 1e4,
      // Digits
      CHAR_0: "0",
      /* 0 */
      CHAR_9: "9",
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: "A",
      /* A */
      CHAR_LOWERCASE_A: "a",
      /* a */
      CHAR_UPPERCASE_Z: "Z",
      /* Z */
      CHAR_LOWERCASE_Z: "z",
      /* z */
      CHAR_LEFT_PARENTHESES: "(",
      /* ( */
      CHAR_RIGHT_PARENTHESES: ")",
      /* ) */
      CHAR_ASTERISK: "*",
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: "&",
      /* & */
      CHAR_AT: "@",
      /* @ */
      CHAR_BACKSLASH: "\\",
      /* \ */
      CHAR_BACKTICK: "`",
      /* ` */
      CHAR_CARRIAGE_RETURN: "\r",
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: "^",
      /* ^ */
      CHAR_COLON: ":",
      /* : */
      CHAR_COMMA: ",",
      /* , */
      CHAR_DOLLAR: "$",
      /* . */
      CHAR_DOT: ".",
      /* . */
      CHAR_DOUBLE_QUOTE: '"',
      /* " */
      CHAR_EQUAL: "=",
      /* = */
      CHAR_EXCLAMATION_MARK: "!",
      /* ! */
      CHAR_FORM_FEED: "\f",
      /* \f */
      CHAR_FORWARD_SLASH: "/",
      /* / */
      CHAR_HASH: "#",
      /* # */
      CHAR_HYPHEN_MINUS: "-",
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: "<",
      /* < */
      CHAR_LEFT_CURLY_BRACE: "{",
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: "[",
      /* [ */
      CHAR_LINE_FEED: "\n",
      /* \n */
      CHAR_NO_BREAK_SPACE: "\xA0",
      /* \u00A0 */
      CHAR_PERCENT: "%",
      /* % */
      CHAR_PLUS: "+",
      /* + */
      CHAR_QUESTION_MARK: "?",
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: ">",
      /* > */
      CHAR_RIGHT_CURLY_BRACE: "}",
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: "]",
      /* ] */
      CHAR_SEMICOLON: ";",
      /* ; */
      CHAR_SINGLE_QUOTE: "'",
      /* ' */
      CHAR_SPACE: " ",
      /*   */
      CHAR_TAB: "	",
      /* \t */
      CHAR_UNDERSCORE: "_",
      /* _ */
      CHAR_VERTICAL_LINE: "|",
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: "\uFEFF"
      /* \uFEFF */
    };
  }
});

// ../../node_modules/braces/lib/parse.js
var require_parse = __commonJS({
  "../../node_modules/braces/lib/parse.js"(exports2, module2) {
    "use strict";
    var stringify = require_stringify();
    var {
      MAX_LENGTH,
      CHAR_BACKSLASH,
      /* \ */
      CHAR_BACKTICK,
      /* ` */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_RIGHT_SQUARE_BRACKET,
      /* ] */
      CHAR_DOUBLE_QUOTE,
      /* " */
      CHAR_SINGLE_QUOTE,
      /* ' */
      CHAR_NO_BREAK_SPACE,
      CHAR_ZERO_WIDTH_NOBREAK_SPACE
    } = require_constants();
    var parse = (input, options = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      const opts = options || {};
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      if (input.length > max) {
        throw new SyntaxError(`Input length (${input.length}), exceeds max characters (${max})`);
      }
      const ast = { type: "root", input, nodes: [] };
      const stack = [ast];
      let block = ast;
      let prev = ast;
      let brackets = 0;
      const length = input.length;
      let index = 0;
      let depth = 0;
      let value;
      const advance = () => input[index++];
      const push = (node) => {
        if (node.type === "text" && prev.type === "dot") {
          prev.type = "text";
        }
        if (prev && prev.type === "text" && node.type === "text") {
          prev.value += node.value;
          return;
        }
        block.nodes.push(node);
        node.parent = block;
        node.prev = prev;
        prev = node;
        return node;
      };
      push({ type: "bos" });
      while (index < length) {
        block = stack[stack.length - 1];
        value = advance();
        if (value === CHAR_ZERO_WIDTH_NOBREAK_SPACE || value === CHAR_NO_BREAK_SPACE) {
          continue;
        }
        if (value === CHAR_BACKSLASH) {
          push({ type: "text", value: (options.keepEscaping ? value : "") + advance() });
          continue;
        }
        if (value === CHAR_RIGHT_SQUARE_BRACKET) {
          push({ type: "text", value: "\\" + value });
          continue;
        }
        if (value === CHAR_LEFT_SQUARE_BRACKET) {
          brackets++;
          let next;
          while (index < length && (next = advance())) {
            value += next;
            if (next === CHAR_LEFT_SQUARE_BRACKET) {
              brackets++;
              continue;
            }
            if (next === CHAR_BACKSLASH) {
              value += advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              brackets--;
              if (brackets === 0) {
                break;
              }
            }
          }
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_LEFT_PARENTHESES) {
          block = push({ type: "paren", nodes: [] });
          stack.push(block);
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_RIGHT_PARENTHESES) {
          if (block.type !== "paren") {
            push({ type: "text", value });
            continue;
          }
          block = stack.pop();
          push({ type: "text", value });
          block = stack[stack.length - 1];
          continue;
        }
        if (value === CHAR_DOUBLE_QUOTE || value === CHAR_SINGLE_QUOTE || value === CHAR_BACKTICK) {
          const open = value;
          let next;
          if (options.keepQuotes !== true) {
            value = "";
          }
          while (index < length && (next = advance())) {
            if (next === CHAR_BACKSLASH) {
              value += next + advance();
              continue;
            }
            if (next === open) {
              if (options.keepQuotes === true) value += next;
              break;
            }
            value += next;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_LEFT_CURLY_BRACE) {
          depth++;
          const dollar = prev.value && prev.value.slice(-1) === "$" || block.dollar === true;
          const brace = {
            type: "brace",
            open: true,
            close: false,
            dollar,
            depth,
            commas: 0,
            ranges: 0,
            nodes: []
          };
          block = push(brace);
          stack.push(block);
          push({ type: "open", value });
          continue;
        }
        if (value === CHAR_RIGHT_CURLY_BRACE) {
          if (block.type !== "brace") {
            push({ type: "text", value });
            continue;
          }
          const type = "close";
          block = stack.pop();
          block.close = true;
          push({ type, value });
          depth--;
          block = stack[stack.length - 1];
          continue;
        }
        if (value === CHAR_COMMA && depth > 0) {
          if (block.ranges > 0) {
            block.ranges = 0;
            const open = block.nodes.shift();
            block.nodes = [open, { type: "text", value: stringify(block) }];
          }
          push({ type: "comma", value });
          block.commas++;
          continue;
        }
        if (value === CHAR_DOT && depth > 0 && block.commas === 0) {
          const siblings = block.nodes;
          if (depth === 0 || siblings.length === 0) {
            push({ type: "text", value });
            continue;
          }
          if (prev.type === "dot") {
            block.range = [];
            prev.value += value;
            prev.type = "range";
            if (block.nodes.length !== 3 && block.nodes.length !== 5) {
              block.invalid = true;
              block.ranges = 0;
              prev.type = "text";
              continue;
            }
            block.ranges++;
            block.args = [];
            continue;
          }
          if (prev.type === "range") {
            siblings.pop();
            const before = siblings[siblings.length - 1];
            before.value += prev.value + value;
            prev = before;
            block.ranges--;
            continue;
          }
          push({ type: "dot", value });
          continue;
        }
        push({ type: "text", value });
      }
      do {
        block = stack.pop();
        if (block.type !== "root") {
          block.nodes.forEach((node) => {
            if (!node.nodes) {
              if (node.type === "open") node.isOpen = true;
              if (node.type === "close") node.isClose = true;
              if (!node.nodes) node.type = "text";
              node.invalid = true;
            }
          });
          const parent = stack[stack.length - 1];
          const index2 = parent.nodes.indexOf(block);
          parent.nodes.splice(index2, 1, ...block.nodes);
        }
      } while (stack.length > 0);
      push({ type: "eos" });
      return ast;
    };
    module2.exports = parse;
  }
});

// ../../node_modules/braces/index.js
var require_braces = __commonJS({
  "../../node_modules/braces/index.js"(exports2, module2) {
    "use strict";
    var stringify = require_stringify();
    var compile = require_compile();
    var expand = require_expand();
    var parse = require_parse();
    var braces = (input, options = {}) => {
      let output = [];
      if (Array.isArray(input)) {
        for (const pattern of input) {
          const result = braces.create(pattern, options);
          if (Array.isArray(result)) {
            output.push(...result);
          } else {
            output.push(result);
          }
        }
      } else {
        output = [].concat(braces.create(input, options));
      }
      if (options && options.expand === true && options.nodupes === true) {
        output = [...new Set(output)];
      }
      return output;
    };
    braces.parse = (input, options = {}) => parse(input, options);
    braces.stringify = (input, options = {}) => {
      if (typeof input === "string") {
        return stringify(braces.parse(input, options), options);
      }
      return stringify(input, options);
    };
    braces.compile = (input, options = {}) => {
      if (typeof input === "string") {
        input = braces.parse(input, options);
      }
      return compile(input, options);
    };
    braces.expand = (input, options = {}) => {
      if (typeof input === "string") {
        input = braces.parse(input, options);
      }
      let result = expand(input, options);
      if (options.noempty === true) {
        result = result.filter(Boolean);
      }
      if (options.nodupes === true) {
        result = [...new Set(result)];
      }
      return result;
    };
    braces.create = (input, options = {}) => {
      if (input === "" || input.length < 3) {
        return [input];
      }
      return options.expand !== true ? braces.compile(input, options) : braces.expand(input, options);
    };
    module2.exports = braces;
  }
});

// ../../node_modules/picomatch/lib/constants.js
var require_constants2 = __commonJS({
  "../../node_modules/picomatch/lib/constants.js"(exports2, module2) {
    "use strict";
    var path4 = require("path");
    var WIN_SLASH = "\\\\/";
    var WIN_NO_SLASH = `[^${WIN_SLASH}]`;
    var DEFAULT_MAX_EXTGLOB_RECURSION = 0;
    var DOT_LITERAL = "\\.";
    var PLUS_LITERAL = "\\+";
    var QMARK_LITERAL = "\\?";
    var SLASH_LITERAL = "\\/";
    var ONE_CHAR = "(?=.)";
    var QMARK = "[^/]";
    var END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
    var START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
    var DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
    var NO_DOT = `(?!${DOT_LITERAL})`;
    var NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
    var NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
    var NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
    var QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
    var STAR = `${QMARK}*?`;
    var POSIX_CHARS = {
      DOT_LITERAL,
      PLUS_LITERAL,
      QMARK_LITERAL,
      SLASH_LITERAL,
      ONE_CHAR,
      QMARK,
      END_ANCHOR,
      DOTS_SLASH,
      NO_DOT,
      NO_DOTS,
      NO_DOT_SLASH,
      NO_DOTS_SLASH,
      QMARK_NO_DOT,
      STAR,
      START_ANCHOR
    };
    var WINDOWS_CHARS = {
      ...POSIX_CHARS,
      SLASH_LITERAL: `[${WIN_SLASH}]`,
      QMARK: WIN_NO_SLASH,
      STAR: `${WIN_NO_SLASH}*?`,
      DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
      NO_DOT: `(?!${DOT_LITERAL})`,
      NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
      NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
      START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
      END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
    };
    var POSIX_REGEX_SOURCE = {
      __proto__: null,
      alnum: "a-zA-Z0-9",
      alpha: "a-zA-Z",
      ascii: "\\x00-\\x7F",
      blank: " \\t",
      cntrl: "\\x00-\\x1F\\x7F",
      digit: "0-9",
      graph: "\\x21-\\x7E",
      lower: "a-z",
      print: "\\x20-\\x7E ",
      punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
      space: " \\t\\r\\n\\v\\f",
      upper: "A-Z",
      word: "A-Za-z0-9_",
      xdigit: "A-Fa-f0-9"
    };
    module2.exports = {
      DEFAULT_MAX_EXTGLOB_RECURSION,
      MAX_LENGTH: 1024 * 64,
      POSIX_REGEX_SOURCE,
      // regular expressions
      REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
      REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
      REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
      REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
      REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
      REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
      // Replace globs with equivalent patterns to reduce parsing time.
      REPLACEMENTS: {
        __proto__: null,
        "***": "*",
        "**/**": "**",
        "**/**/**": "**"
      },
      // Digits
      CHAR_0: 48,
      /* 0 */
      CHAR_9: 57,
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: 65,
      /* A */
      CHAR_LOWERCASE_A: 97,
      /* a */
      CHAR_UPPERCASE_Z: 90,
      /* Z */
      CHAR_LOWERCASE_Z: 122,
      /* z */
      CHAR_LEFT_PARENTHESES: 40,
      /* ( */
      CHAR_RIGHT_PARENTHESES: 41,
      /* ) */
      CHAR_ASTERISK: 42,
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: 38,
      /* & */
      CHAR_AT: 64,
      /* @ */
      CHAR_BACKWARD_SLASH: 92,
      /* \ */
      CHAR_CARRIAGE_RETURN: 13,
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: 94,
      /* ^ */
      CHAR_COLON: 58,
      /* : */
      CHAR_COMMA: 44,
      /* , */
      CHAR_DOT: 46,
      /* . */
      CHAR_DOUBLE_QUOTE: 34,
      /* " */
      CHAR_EQUAL: 61,
      /* = */
      CHAR_EXCLAMATION_MARK: 33,
      /* ! */
      CHAR_FORM_FEED: 12,
      /* \f */
      CHAR_FORWARD_SLASH: 47,
      /* / */
      CHAR_GRAVE_ACCENT: 96,
      /* ` */
      CHAR_HASH: 35,
      /* # */
      CHAR_HYPHEN_MINUS: 45,
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: 60,
      /* < */
      CHAR_LEFT_CURLY_BRACE: 123,
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: 91,
      /* [ */
      CHAR_LINE_FEED: 10,
      /* \n */
      CHAR_NO_BREAK_SPACE: 160,
      /* \u00A0 */
      CHAR_PERCENT: 37,
      /* % */
      CHAR_PLUS: 43,
      /* + */
      CHAR_QUESTION_MARK: 63,
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: 62,
      /* > */
      CHAR_RIGHT_CURLY_BRACE: 125,
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: 93,
      /* ] */
      CHAR_SEMICOLON: 59,
      /* ; */
      CHAR_SINGLE_QUOTE: 39,
      /* ' */
      CHAR_SPACE: 32,
      /*   */
      CHAR_TAB: 9,
      /* \t */
      CHAR_UNDERSCORE: 95,
      /* _ */
      CHAR_VERTICAL_LINE: 124,
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
      /* \uFEFF */
      SEP: path4.sep,
      /**
       * Create EXTGLOB_CHARS
       */
      extglobChars(chars) {
        return {
          "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars.STAR})` },
          "?": { type: "qmark", open: "(?:", close: ")?" },
          "+": { type: "plus", open: "(?:", close: ")+" },
          "*": { type: "star", open: "(?:", close: ")*" },
          "@": { type: "at", open: "(?:", close: ")" }
        };
      },
      /**
       * Create GLOB_CHARS
       */
      globChars(win32) {
        return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
      }
    };
  }
});

// ../../node_modules/picomatch/lib/utils.js
var require_utils2 = __commonJS({
  "../../node_modules/picomatch/lib/utils.js"(exports2) {
    "use strict";
    var path4 = require("path");
    var win32 = process.platform === "win32";
    var {
      REGEX_BACKSLASH,
      REGEX_REMOVE_BACKSLASH,
      REGEX_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_GLOBAL
    } = require_constants2();
    exports2.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    exports2.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
    exports2.isRegexChar = (str) => str.length === 1 && exports2.hasRegexChars(str);
    exports2.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
    exports2.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
    exports2.removeBackslashes = (str) => {
      return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
        return match === "\\" ? "" : match;
      });
    };
    exports2.supportsLookbehinds = () => {
      const segs = process.version.slice(1).split(".").map(Number);
      if (segs.length === 3 && segs[0] >= 9 || segs[0] === 8 && segs[1] >= 10) {
        return true;
      }
      return false;
    };
    exports2.isWindows = (options) => {
      if (options && typeof options.windows === "boolean") {
        return options.windows;
      }
      return win32 === true || path4.sep === "\\";
    };
    exports2.escapeLast = (input, char, lastIdx) => {
      const idx = input.lastIndexOf(char, lastIdx);
      if (idx === -1) return input;
      if (input[idx - 1] === "\\") return exports2.escapeLast(input, char, idx - 1);
      return `${input.slice(0, idx)}\\${input.slice(idx)}`;
    };
    exports2.removePrefix = (input, state = {}) => {
      let output = input;
      if (output.startsWith("./")) {
        output = output.slice(2);
        state.prefix = "./";
      }
      return output;
    };
    exports2.wrapOutput = (input, state = {}, options = {}) => {
      const prepend = options.contains ? "" : "^";
      const append = options.contains ? "" : "$";
      let output = `${prepend}(?:${input})${append}`;
      if (state.negated === true) {
        output = `(?:^(?!${output}).*$)`;
      }
      return output;
    };
  }
});

// ../../node_modules/picomatch/lib/scan.js
var require_scan = __commonJS({
  "../../node_modules/picomatch/lib/scan.js"(exports2, module2) {
    "use strict";
    var utils = require_utils2();
    var {
      CHAR_ASTERISK,
      /* * */
      CHAR_AT,
      /* @ */
      CHAR_BACKWARD_SLASH,
      /* \ */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_EXCLAMATION_MARK,
      /* ! */
      CHAR_FORWARD_SLASH,
      /* / */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_PLUS,
      /* + */
      CHAR_QUESTION_MARK,
      /* ? */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_RIGHT_SQUARE_BRACKET
      /* ] */
    } = require_constants2();
    var isPathSeparator = (code) => {
      return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    };
    var depth = (token) => {
      if (token.isPrefix !== true) {
        token.depth = token.isGlobstar ? Infinity : 1;
      }
    };
    var scan = (input, options) => {
      const opts = options || {};
      const length = input.length - 1;
      const scanToEnd = opts.parts === true || opts.scanToEnd === true;
      const slashes = [];
      const tokens = [];
      const parts = [];
      let str = input;
      let index = -1;
      let start = 0;
      let lastIndex = 0;
      let isBrace = false;
      let isBracket = false;
      let isGlob = false;
      let isExtglob = false;
      let isGlobstar = false;
      let braceEscaped = false;
      let backslashes = false;
      let negated = false;
      let negatedExtglob = false;
      let finished = false;
      let braces = 0;
      let prev;
      let code;
      let token = { value: "", depth: 0, isGlob: false };
      const eos = () => index >= length;
      const peek = () => str.charCodeAt(index + 1);
      const advance = () => {
        prev = code;
        return str.charCodeAt(++index);
      };
      while (index < length) {
        code = advance();
        let next;
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          code = advance();
          if (code === CHAR_LEFT_CURLY_BRACE) {
            braceEscaped = true;
          }
          continue;
        }
        if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (code === CHAR_LEFT_CURLY_BRACE) {
              braces++;
              continue;
            }
            if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (braceEscaped !== true && code === CHAR_COMMA) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (code === CHAR_RIGHT_CURLY_BRACE) {
              braces--;
              if (braces === 0) {
                braceEscaped = false;
                isBrace = token.isBrace = true;
                finished = true;
                break;
              }
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_FORWARD_SLASH) {
          slashes.push(index);
          tokens.push(token);
          token = { value: "", depth: 0, isGlob: false };
          if (finished === true) continue;
          if (prev === CHAR_DOT && index === start + 1) {
            start += 2;
            continue;
          }
          lastIndex = index + 1;
          continue;
        }
        if (opts.noext !== true) {
          const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
          if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
            isGlob = token.isGlob = true;
            isExtglob = token.isExtglob = true;
            finished = true;
            if (code === CHAR_EXCLAMATION_MARK && index === start) {
              negatedExtglob = true;
            }
            if (scanToEnd === true) {
              while (eos() !== true && (code = advance())) {
                if (code === CHAR_BACKWARD_SLASH) {
                  backslashes = token.backslashes = true;
                  code = advance();
                  continue;
                }
                if (code === CHAR_RIGHT_PARENTHESES) {
                  isGlob = token.isGlob = true;
                  finished = true;
                  break;
                }
              }
              continue;
            }
            break;
          }
        }
        if (code === CHAR_ASTERISK) {
          if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_QUESTION_MARK) {
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_LEFT_SQUARE_BRACKET) {
          while (eos() !== true && (next = advance())) {
            if (next === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              isBracket = token.isBracket = true;
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
          negated = token.negated = true;
          start++;
          continue;
        }
        if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
          isGlob = token.isGlob = true;
          if (scanToEnd === true) {
            while (eos() !== true && (code = advance())) {
              if (code === CHAR_LEFT_PARENTHESES) {
                backslashes = token.backslashes = true;
                code = advance();
                continue;
              }
              if (code === CHAR_RIGHT_PARENTHESES) {
                finished = true;
                break;
              }
            }
            continue;
          }
          break;
        }
        if (isGlob === true) {
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
      }
      if (opts.noext === true) {
        isExtglob = false;
        isGlob = false;
      }
      let base = str;
      let prefix = "";
      let glob2 = "";
      if (start > 0) {
        prefix = str.slice(0, start);
        str = str.slice(start);
        lastIndex -= start;
      }
      if (base && isGlob === true && lastIndex > 0) {
        base = str.slice(0, lastIndex);
        glob2 = str.slice(lastIndex);
      } else if (isGlob === true) {
        base = "";
        glob2 = str;
      } else {
        base = str;
      }
      if (base && base !== "" && base !== "/" && base !== str) {
        if (isPathSeparator(base.charCodeAt(base.length - 1))) {
          base = base.slice(0, -1);
        }
      }
      if (opts.unescape === true) {
        if (glob2) glob2 = utils.removeBackslashes(glob2);
        if (base && backslashes === true) {
          base = utils.removeBackslashes(base);
        }
      }
      const state = {
        prefix,
        input,
        start,
        base,
        glob: glob2,
        isBrace,
        isBracket,
        isGlob,
        isExtglob,
        isGlobstar,
        negated,
        negatedExtglob
      };
      if (opts.tokens === true) {
        state.maxDepth = 0;
        if (!isPathSeparator(code)) {
          tokens.push(token);
        }
        state.tokens = tokens;
      }
      if (opts.parts === true || opts.tokens === true) {
        let prevIndex;
        for (let idx = 0; idx < slashes.length; idx++) {
          const n = prevIndex ? prevIndex + 1 : start;
          const i = slashes[idx];
          const value = input.slice(n, i);
          if (opts.tokens) {
            if (idx === 0 && start !== 0) {
              tokens[idx].isPrefix = true;
              tokens[idx].value = prefix;
            } else {
              tokens[idx].value = value;
            }
            depth(tokens[idx]);
            state.maxDepth += tokens[idx].depth;
          }
          if (idx !== 0 || value !== "") {
            parts.push(value);
          }
          prevIndex = i;
        }
        if (prevIndex && prevIndex + 1 < input.length) {
          const value = input.slice(prevIndex + 1);
          parts.push(value);
          if (opts.tokens) {
            tokens[tokens.length - 1].value = value;
            depth(tokens[tokens.length - 1]);
            state.maxDepth += tokens[tokens.length - 1].depth;
          }
        }
        state.slashes = slashes;
        state.parts = parts;
      }
      return state;
    };
    module2.exports = scan;
  }
});

// ../../node_modules/picomatch/lib/parse.js
var require_parse2 = __commonJS({
  "../../node_modules/picomatch/lib/parse.js"(exports2, module2) {
    "use strict";
    var constants2 = require_constants2();
    var utils = require_utils2();
    var {
      MAX_LENGTH,
      POSIX_REGEX_SOURCE,
      REGEX_NON_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_BACKREF,
      REPLACEMENTS
    } = constants2;
    var expandRange = (args, options) => {
      if (typeof options.expandRange === "function") {
        return options.expandRange(...args, options);
      }
      args.sort();
      const value = `[${args.join("-")}]`;
      try {
        new RegExp(value);
      } catch (ex) {
        return args.map((v) => utils.escapeRegex(v)).join("..");
      }
      return value;
    };
    var syntaxError = (type, char) => {
      return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
    };
    var splitTopLevel = (input) => {
      const parts = [];
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let value = "";
      let escaped = false;
      for (const ch of input) {
        if (escaped === true) {
          value += ch;
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          value += ch;
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          value += ch;
          continue;
        }
        if (quote === 0) {
          if (ch === "[") {
            bracket++;
          } else if (ch === "]" && bracket > 0) {
            bracket--;
          } else if (bracket === 0) {
            if (ch === "(") {
              paren++;
            } else if (ch === ")" && paren > 0) {
              paren--;
            } else if (ch === "|" && paren === 0) {
              parts.push(value);
              value = "";
              continue;
            }
          }
        }
        value += ch;
      }
      parts.push(value);
      return parts;
    };
    var isPlainBranch = (branch) => {
      let escaped = false;
      for (const ch of branch) {
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (/[?*+@!()[\]{}]/.test(ch)) {
          return false;
        }
      }
      return true;
    };
    var normalizeSimpleBranch = (branch) => {
      let value = branch.trim();
      let changed = true;
      while (changed === true) {
        changed = false;
        if (/^@\([^\\()[\]{}|]+\)$/.test(value)) {
          value = value.slice(2, -1);
          changed = true;
        }
      }
      if (!isPlainBranch(value)) {
        return;
      }
      return value.replace(/\\(.)/g, "$1");
    };
    var hasRepeatedCharPrefixOverlap = (branches) => {
      const values = branches.map(normalizeSimpleBranch).filter(Boolean);
      for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
          const a = values[i];
          const b = values[j];
          const char = a[0];
          if (!char || a !== char.repeat(a.length) || b !== char.repeat(b.length)) {
            continue;
          }
          if (a === b || a.startsWith(b) || b.startsWith(a)) {
            return true;
          }
        }
      }
      return false;
    };
    var parseRepeatedExtglob = (pattern, requireEnd = true) => {
      if (pattern[0] !== "+" && pattern[0] !== "*" || pattern[1] !== "(") {
        return;
      }
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let escaped = false;
      for (let i = 1; i < pattern.length; i++) {
        const ch = pattern[i];
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          continue;
        }
        if (quote === 1) {
          continue;
        }
        if (ch === "[") {
          bracket++;
          continue;
        }
        if (ch === "]" && bracket > 0) {
          bracket--;
          continue;
        }
        if (bracket > 0) {
          continue;
        }
        if (ch === "(") {
          paren++;
          continue;
        }
        if (ch === ")") {
          paren--;
          if (paren === 0) {
            if (requireEnd === true && i !== pattern.length - 1) {
              return;
            }
            return {
              type: pattern[0],
              body: pattern.slice(2, i),
              end: i
            };
          }
        }
      }
    };
    var getStarExtglobSequenceOutput = (pattern) => {
      let index = 0;
      const chars = [];
      while (index < pattern.length) {
        const match = parseRepeatedExtglob(pattern.slice(index), false);
        if (!match || match.type !== "*") {
          return;
        }
        const branches = splitTopLevel(match.body).map((branch2) => branch2.trim());
        if (branches.length !== 1) {
          return;
        }
        const branch = normalizeSimpleBranch(branches[0]);
        if (!branch || branch.length !== 1) {
          return;
        }
        chars.push(branch);
        index += match.end + 1;
      }
      if (chars.length < 1) {
        return;
      }
      const source = chars.length === 1 ? utils.escapeRegex(chars[0]) : `[${chars.map((ch) => utils.escapeRegex(ch)).join("")}]`;
      return `${source}*`;
    };
    var repeatedExtglobRecursion = (pattern) => {
      let depth = 0;
      let value = pattern.trim();
      let match = parseRepeatedExtglob(value);
      while (match) {
        depth++;
        value = match.body.trim();
        match = parseRepeatedExtglob(value);
      }
      return depth;
    };
    var analyzeRepeatedExtglob = (body, options) => {
      if (options.maxExtglobRecursion === false) {
        return { risky: false };
      }
      const max = typeof options.maxExtglobRecursion === "number" ? options.maxExtglobRecursion : constants2.DEFAULT_MAX_EXTGLOB_RECURSION;
      const branches = splitTopLevel(body).map((branch) => branch.trim());
      if (branches.length > 1) {
        if (branches.some((branch) => branch === "") || branches.some((branch) => /^[*?]+$/.test(branch)) || hasRepeatedCharPrefixOverlap(branches)) {
          return { risky: true };
        }
      }
      for (const branch of branches) {
        const safeOutput = getStarExtglobSequenceOutput(branch);
        if (safeOutput) {
          return { risky: true, safeOutput };
        }
        if (repeatedExtglobRecursion(branch) > max) {
          return { risky: true };
        }
      }
      return { risky: false };
    };
    var parse = (input, options) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      input = REPLACEMENTS[input] || input;
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      let len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      const bos = { type: "bos", value: "", output: opts.prepend || "" };
      const tokens = [bos];
      const capture = opts.capture ? "" : "?:";
      const win32 = utils.isWindows(options);
      const PLATFORM_CHARS = constants2.globChars(win32);
      const EXTGLOB_CHARS = constants2.extglobChars(PLATFORM_CHARS);
      const {
        DOT_LITERAL,
        PLUS_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK,
        QMARK_NO_DOT,
        STAR,
        START_ANCHOR
      } = PLATFORM_CHARS;
      const globstar = (opts2) => {
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const nodot = opts.dot ? "" : NO_DOT;
      const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
      let star = opts.bash === true ? globstar(opts) : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      if (typeof opts.noext === "boolean") {
        opts.noextglob = opts.noext;
      }
      const state = {
        input,
        index: -1,
        start: 0,
        dot: opts.dot === true,
        consumed: "",
        output: "",
        prefix: "",
        backtrack: false,
        negated: false,
        brackets: 0,
        braces: 0,
        parens: 0,
        quotes: 0,
        globstar: false,
        tokens
      };
      input = utils.removePrefix(input, state);
      len = input.length;
      const extglobs = [];
      const braces = [];
      const stack = [];
      let prev = bos;
      let value;
      const eos = () => state.index === len - 1;
      const peek = state.peek = (n = 1) => input[state.index + n];
      const advance = state.advance = () => input[++state.index] || "";
      const remaining = () => input.slice(state.index + 1);
      const consume = (value2 = "", num = 0) => {
        state.consumed += value2;
        state.index += num;
      };
      const append = (token) => {
        state.output += token.output != null ? token.output : token.value;
        consume(token.value);
      };
      const negate = () => {
        let count = 1;
        while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
          advance();
          state.start++;
          count++;
        }
        if (count % 2 === 0) {
          return false;
        }
        state.negated = true;
        state.start++;
        return true;
      };
      const increment = (type) => {
        state[type]++;
        stack.push(type);
      };
      const decrement = (type) => {
        state[type]--;
        stack.pop();
      };
      const push = (tok) => {
        if (prev.type === "globstar") {
          const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
          const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
          if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
            state.output = state.output.slice(0, -prev.output.length);
            prev.type = "star";
            prev.value = "*";
            prev.output = star;
            state.output += prev.output;
          }
        }
        if (extglobs.length && tok.type !== "paren") {
          extglobs[extglobs.length - 1].inner += tok.value;
        }
        if (tok.value || tok.output) append(tok);
        if (prev && prev.type === "text" && tok.type === "text") {
          prev.value += tok.value;
          prev.output = (prev.output || "") + tok.value;
          return;
        }
        tok.prev = prev;
        tokens.push(tok);
        prev = tok;
      };
      const extglobOpen = (type, value2) => {
        const token = { ...EXTGLOB_CHARS[value2], conditions: 1, inner: "" };
        token.prev = prev;
        token.parens = state.parens;
        token.output = state.output;
        token.startIndex = state.index;
        token.tokensIndex = tokens.length;
        const output = (opts.capture ? "(" : "") + token.open;
        increment("parens");
        push({ type, value: value2, output: state.output ? "" : ONE_CHAR });
        push({ type: "paren", extglob: true, value: advance(), output });
        extglobs.push(token);
      };
      const extglobClose = (token) => {
        const literal = input.slice(token.startIndex, state.index + 1);
        const body = input.slice(token.startIndex + 2, state.index);
        const analysis = analyzeRepeatedExtglob(body, opts);
        if ((token.type === "plus" || token.type === "star") && analysis.risky) {
          const safeOutput = analysis.safeOutput ? (token.output ? "" : ONE_CHAR) + (opts.capture ? `(${analysis.safeOutput})` : analysis.safeOutput) : void 0;
          const open = tokens[token.tokensIndex];
          open.type = "text";
          open.value = literal;
          open.output = safeOutput || utils.escapeRegex(literal);
          for (let i = token.tokensIndex + 1; i < tokens.length; i++) {
            tokens[i].value = "";
            tokens[i].output = "";
            delete tokens[i].suffix;
          }
          state.output = token.output + open.output;
          state.backtrack = true;
          push({ type: "paren", extglob: true, value, output: "" });
          decrement("parens");
          return;
        }
        let output = token.close + (opts.capture ? ")" : "");
        let rest;
        if (token.type === "negate") {
          let extglobStar = star;
          if (token.inner && token.inner.length > 1 && token.inner.includes("/")) {
            extglobStar = globstar(opts);
          }
          if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
            output = token.close = `)$))${extglobStar}`;
          }
          if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
            const expression = parse(rest, { ...options, fastpaths: false }).output;
            output = token.close = `)${expression})${extglobStar})`;
          }
          if (token.prev.type === "bos") {
            state.negatedExtglob = true;
          }
        }
        push({ type: "paren", extglob: true, value, output });
        decrement("parens");
      };
      if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
        let backslashes = false;
        let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
          if (first === "\\") {
            backslashes = true;
            return m;
          }
          if (first === "?") {
            if (esc) {
              return esc + first + (rest ? QMARK.repeat(rest.length) : "");
            }
            if (index === 0) {
              return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : "");
            }
            return QMARK.repeat(chars.length);
          }
          if (first === ".") {
            return DOT_LITERAL.repeat(chars.length);
          }
          if (first === "*") {
            if (esc) {
              return esc + first + (rest ? star : "");
            }
            return star;
          }
          return esc ? m : `\\${m}`;
        });
        if (backslashes === true) {
          if (opts.unescape === true) {
            output = output.replace(/\\/g, "");
          } else {
            output = output.replace(/\\+/g, (m) => {
              return m.length % 2 === 0 ? "\\\\" : m ? "\\" : "";
            });
          }
        }
        if (output === input && opts.contains === true) {
          state.output = input;
          return state;
        }
        state.output = utils.wrapOutput(output, state, options);
        return state;
      }
      while (!eos()) {
        value = advance();
        if (value === "\0") {
          continue;
        }
        if (value === "\\") {
          const next = peek();
          if (next === "/" && opts.bash !== true) {
            continue;
          }
          if (next === "." || next === ";") {
            continue;
          }
          if (!next) {
            value += "\\";
            push({ type: "text", value });
            continue;
          }
          const match = /^\\+/.exec(remaining());
          let slashes = 0;
          if (match && match[0].length > 2) {
            slashes = match[0].length;
            state.index += slashes;
            if (slashes % 2 !== 0) {
              value += "\\";
            }
          }
          if (opts.unescape === true) {
            value = advance();
          } else {
            value += advance();
          }
          if (state.brackets === 0) {
            push({ type: "text", value });
            continue;
          }
        }
        if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
          if (opts.posix !== false && value === ":") {
            const inner = prev.value.slice(1);
            if (inner.includes("[")) {
              prev.posix = true;
              if (inner.includes(":")) {
                const idx = prev.value.lastIndexOf("[");
                const pre = prev.value.slice(0, idx);
                const rest2 = prev.value.slice(idx + 2);
                const posix = POSIX_REGEX_SOURCE[rest2];
                if (posix) {
                  prev.value = pre + posix;
                  state.backtrack = true;
                  advance();
                  if (!bos.output && tokens.indexOf(prev) === 1) {
                    bos.output = ONE_CHAR;
                  }
                  continue;
                }
              }
            }
          }
          if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") {
            value = `\\${value}`;
          }
          if (value === "]" && (prev.value === "[" || prev.value === "[^")) {
            value = `\\${value}`;
          }
          if (opts.posix === true && value === "!" && prev.value === "[") {
            value = "^";
          }
          prev.value += value;
          append({ value });
          continue;
        }
        if (state.quotes === 1 && value !== '"') {
          value = utils.escapeRegex(value);
          prev.value += value;
          append({ value });
          continue;
        }
        if (value === '"') {
          state.quotes = state.quotes === 1 ? 0 : 1;
          if (opts.keepQuotes === true) {
            push({ type: "text", value });
          }
          continue;
        }
        if (value === "(") {
          increment("parens");
          push({ type: "paren", value });
          continue;
        }
        if (value === ")") {
          if (state.parens === 0 && opts.strictBrackets === true) {
            throw new SyntaxError(syntaxError("opening", "("));
          }
          const extglob = extglobs[extglobs.length - 1];
          if (extglob && state.parens === extglob.parens + 1) {
            extglobClose(extglobs.pop());
            continue;
          }
          push({ type: "paren", value, output: state.parens ? ")" : "\\)" });
          decrement("parens");
          continue;
        }
        if (value === "[") {
          if (opts.nobracket === true || !remaining().includes("]")) {
            if (opts.nobracket !== true && opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("closing", "]"));
            }
            value = `\\${value}`;
          } else {
            increment("brackets");
          }
          push({ type: "bracket", value });
          continue;
        }
        if (value === "]") {
          if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          if (state.brackets === 0) {
            if (opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("opening", "["));
            }
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          decrement("brackets");
          const prevValue = prev.value.slice(1);
          if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) {
            value = `/${value}`;
          }
          prev.value += value;
          append({ value });
          if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
            continue;
          }
          const escaped = utils.escapeRegex(prev.value);
          state.output = state.output.slice(0, -prev.value.length);
          if (opts.literalBrackets === true) {
            state.output += escaped;
            prev.value = escaped;
            continue;
          }
          prev.value = `(${capture}${escaped}|${prev.value})`;
          state.output += prev.value;
          continue;
        }
        if (value === "{" && opts.nobrace !== true) {
          increment("braces");
          const open = {
            type: "brace",
            value,
            output: "(",
            outputIndex: state.output.length,
            tokensIndex: state.tokens.length
          };
          braces.push(open);
          push(open);
          continue;
        }
        if (value === "}") {
          const brace = braces[braces.length - 1];
          if (opts.nobrace === true || !brace) {
            push({ type: "text", value, output: value });
            continue;
          }
          let output = ")";
          if (brace.dots === true) {
            const arr = tokens.slice();
            const range = [];
            for (let i = arr.length - 1; i >= 0; i--) {
              tokens.pop();
              if (arr[i].type === "brace") {
                break;
              }
              if (arr[i].type !== "dots") {
                range.unshift(arr[i].value);
              }
            }
            output = expandRange(range, opts);
            state.backtrack = true;
          }
          if (brace.comma !== true && brace.dots !== true) {
            const out = state.output.slice(0, brace.outputIndex);
            const toks = state.tokens.slice(brace.tokensIndex);
            brace.value = brace.output = "\\{";
            value = output = "\\}";
            state.output = out;
            for (const t of toks) {
              state.output += t.output || t.value;
            }
          }
          push({ type: "brace", value, output });
          decrement("braces");
          braces.pop();
          continue;
        }
        if (value === "|") {
          if (extglobs.length > 0) {
            extglobs[extglobs.length - 1].conditions++;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === ",") {
          let output = value;
          const brace = braces[braces.length - 1];
          if (brace && stack[stack.length - 1] === "braces") {
            brace.comma = true;
            output = "|";
          }
          push({ type: "comma", value, output });
          continue;
        }
        if (value === "/") {
          if (prev.type === "dot" && state.index === state.start + 1) {
            state.start = state.index + 1;
            state.consumed = "";
            state.output = "";
            tokens.pop();
            prev = bos;
            continue;
          }
          push({ type: "slash", value, output: SLASH_LITERAL });
          continue;
        }
        if (value === ".") {
          if (state.braces > 0 && prev.type === "dot") {
            if (prev.value === ".") prev.output = DOT_LITERAL;
            const brace = braces[braces.length - 1];
            prev.type = "dots";
            prev.output += value;
            prev.value += value;
            brace.dots = true;
            continue;
          }
          if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
            push({ type: "text", value, output: DOT_LITERAL });
            continue;
          }
          push({ type: "dot", value, output: DOT_LITERAL });
          continue;
        }
        if (value === "?") {
          const isGroup = prev && prev.value === "(";
          if (!isGroup && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("qmark", value);
            continue;
          }
          if (prev && prev.type === "paren") {
            const next = peek();
            let output = value;
            if (next === "<" && !utils.supportsLookbehinds()) {
              throw new Error("Node.js v10 or higher is required for regex lookbehinds");
            }
            if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) {
              output = `\\${value}`;
            }
            push({ type: "text", value, output });
            continue;
          }
          if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
            push({ type: "qmark", value, output: QMARK_NO_DOT });
            continue;
          }
          push({ type: "qmark", value, output: QMARK });
          continue;
        }
        if (value === "!") {
          if (opts.noextglob !== true && peek() === "(") {
            if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
              extglobOpen("negate", value);
              continue;
            }
          }
          if (opts.nonegate !== true && state.index === 0) {
            negate();
            continue;
          }
        }
        if (value === "+") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("plus", value);
            continue;
          }
          if (prev && prev.value === "(" || opts.regex === false) {
            push({ type: "plus", value, output: PLUS_LITERAL });
            continue;
          }
          if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
            push({ type: "plus", value });
            continue;
          }
          push({ type: "plus", value: PLUS_LITERAL });
          continue;
        }
        if (value === "@") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            push({ type: "at", extglob: true, value, output: "" });
            continue;
          }
          push({ type: "text", value });
          continue;
        }
        if (value !== "*") {
          if (value === "$" || value === "^") {
            value = `\\${value}`;
          }
          const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
          if (match) {
            value += match[0];
            state.index += match[0].length;
          }
          push({ type: "text", value });
          continue;
        }
        if (prev && (prev.type === "globstar" || prev.star === true)) {
          prev.type = "star";
          prev.star = true;
          prev.value += value;
          prev.output = star;
          state.backtrack = true;
          state.globstar = true;
          consume(value);
          continue;
        }
        let rest = remaining();
        if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
          extglobOpen("star", value);
          continue;
        }
        if (prev.type === "star") {
          if (opts.noglobstar === true) {
            consume(value);
            continue;
          }
          const prior = prev.prev;
          const before = prior.prev;
          const isStart = prior.type === "slash" || prior.type === "bos";
          const afterStar = before && (before.type === "star" || before.type === "globstar");
          if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
            push({ type: "star", value, output: "" });
            continue;
          }
          const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
          const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
          if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
            push({ type: "star", value, output: "" });
            continue;
          }
          while (rest.slice(0, 3) === "/**") {
            const after = input[state.index + 4];
            if (after && after !== "/") {
              break;
            }
            rest = rest.slice(3);
            consume("/**", 3);
          }
          if (prior.type === "bos" && eos()) {
            prev.type = "globstar";
            prev.value += value;
            prev.output = globstar(opts);
            state.output = prev.output;
            state.globstar = true;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && eos()) {
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
            prev.value += value;
            state.globstar = true;
            state.output += prior.output + prev.output;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
            const end = rest[1] !== void 0 ? "|$" : "";
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
            prev.value += value;
            state.output += prior.output + prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          if (prior.type === "bos" && rest[0] === "/") {
            prev.type = "globstar";
            prev.value += value;
            prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
            state.output = prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          state.output = state.output.slice(0, -prev.output.length);
          prev.type = "globstar";
          prev.output = globstar(opts);
          prev.value += value;
          state.output += prev.output;
          state.globstar = true;
          consume(value);
          continue;
        }
        const token = { type: "star", value, output: star };
        if (opts.bash === true) {
          token.output = ".*?";
          if (prev.type === "bos" || prev.type === "slash") {
            token.output = nodot + token.output;
          }
          push(token);
          continue;
        }
        if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
          token.output = value;
          push(token);
          continue;
        }
        if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
          if (prev.type === "dot") {
            state.output += NO_DOT_SLASH;
            prev.output += NO_DOT_SLASH;
          } else if (opts.dot === true) {
            state.output += NO_DOTS_SLASH;
            prev.output += NO_DOTS_SLASH;
          } else {
            state.output += nodot;
            prev.output += nodot;
          }
          if (peek() !== "*") {
            state.output += ONE_CHAR;
            prev.output += ONE_CHAR;
          }
        }
        push(token);
      }
      while (state.brackets > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
        state.output = utils.escapeLast(state.output, "[");
        decrement("brackets");
      }
      while (state.parens > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
        state.output = utils.escapeLast(state.output, "(");
        decrement("parens");
      }
      while (state.braces > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
        state.output = utils.escapeLast(state.output, "{");
        decrement("braces");
      }
      if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) {
        push({ type: "maybe_slash", value: "", output: `${SLASH_LITERAL}?` });
      }
      if (state.backtrack === true) {
        state.output = "";
        for (const token of state.tokens) {
          state.output += token.output != null ? token.output : token.value;
          if (token.suffix) {
            state.output += token.suffix;
          }
        }
      }
      return state;
    };
    parse.fastpaths = (input, options) => {
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      const len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      input = REPLACEMENTS[input] || input;
      const win32 = utils.isWindows(options);
      const {
        DOT_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOTS_SLASH,
        STAR,
        START_ANCHOR
      } = constants2.globChars(win32);
      const nodot = opts.dot ? NO_DOTS : NO_DOT;
      const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
      const capture = opts.capture ? "" : "?:";
      const state = { negated: false, prefix: "" };
      let star = opts.bash === true ? ".*?" : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      const globstar = (opts2) => {
        if (opts2.noglobstar === true) return star;
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const create = (str) => {
        switch (str) {
          case "*":
            return `${nodot}${ONE_CHAR}${star}`;
          case ".*":
            return `${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*.*":
            return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*/*":
            return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;
          case "**":
            return nodot + globstar(opts);
          case "**/*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;
          case "**/*.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "**/.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;
          default: {
            const match = /^(.*?)\.(\w+)$/.exec(str);
            if (!match) return;
            const source2 = create(match[1]);
            if (!source2) return;
            return source2 + DOT_LITERAL + match[2];
          }
        }
      };
      const output = utils.removePrefix(input, state);
      let source = create(output);
      if (source && opts.strictSlashes !== true) {
        source += `${SLASH_LITERAL}?`;
      }
      return source;
    };
    module2.exports = parse;
  }
});

// ../../node_modules/picomatch/lib/picomatch.js
var require_picomatch = __commonJS({
  "../../node_modules/picomatch/lib/picomatch.js"(exports2, module2) {
    "use strict";
    var path4 = require("path");
    var scan = require_scan();
    var parse = require_parse2();
    var utils = require_utils2();
    var constants2 = require_constants2();
    var isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
    var picomatch = (glob2, options, returnState = false) => {
      if (Array.isArray(glob2)) {
        const fns = glob2.map((input) => picomatch(input, options, returnState));
        const arrayMatcher = (str) => {
          for (const isMatch of fns) {
            const state2 = isMatch(str);
            if (state2) return state2;
          }
          return false;
        };
        return arrayMatcher;
      }
      const isState = isObject(glob2) && glob2.tokens && glob2.input;
      if (glob2 === "" || typeof glob2 !== "string" && !isState) {
        throw new TypeError("Expected pattern to be a non-empty string");
      }
      const opts = options || {};
      const posix = utils.isWindows(options);
      const regex = isState ? picomatch.compileRe(glob2, options) : picomatch.makeRe(glob2, options, false, true);
      const state = regex.state;
      delete regex.state;
      let isIgnored = () => false;
      if (opts.ignore) {
        const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
        isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
      }
      const matcher = (input, returnObject = false) => {
        const { isMatch, match, output } = picomatch.test(input, regex, options, { glob: glob2, posix });
        const result = { glob: glob2, state, regex, posix, input, output, match, isMatch };
        if (typeof opts.onResult === "function") {
          opts.onResult(result);
        }
        if (isMatch === false) {
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (isIgnored(input)) {
          if (typeof opts.onIgnore === "function") {
            opts.onIgnore(result);
          }
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (typeof opts.onMatch === "function") {
          opts.onMatch(result);
        }
        return returnObject ? result : true;
      };
      if (returnState) {
        matcher.state = state;
      }
      return matcher;
    };
    picomatch.test = (input, regex, options, { glob: glob2, posix } = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected input to be a string");
      }
      if (input === "") {
        return { isMatch: false, output: "" };
      }
      const opts = options || {};
      const format = opts.format || (posix ? utils.toPosixSlashes : null);
      let match = input === glob2;
      let output = match && format ? format(input) : input;
      if (match === false) {
        output = format ? format(input) : input;
        match = output === glob2;
      }
      if (match === false || opts.capture === true) {
        if (opts.matchBase === true || opts.basename === true) {
          match = picomatch.matchBase(input, regex, options, posix);
        } else {
          match = regex.exec(output);
        }
      }
      return { isMatch: Boolean(match), match, output };
    };
    picomatch.matchBase = (input, glob2, options, posix = utils.isWindows(options)) => {
      const regex = glob2 instanceof RegExp ? glob2 : picomatch.makeRe(glob2, options);
      return regex.test(path4.basename(input));
    };
    picomatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
    picomatch.parse = (pattern, options) => {
      if (Array.isArray(pattern)) return pattern.map((p) => picomatch.parse(p, options));
      return parse(pattern, { ...options, fastpaths: false });
    };
    picomatch.scan = (input, options) => scan(input, options);
    picomatch.compileRe = (state, options, returnOutput = false, returnState = false) => {
      if (returnOutput === true) {
        return state.output;
      }
      const opts = options || {};
      const prepend = opts.contains ? "" : "^";
      const append = opts.contains ? "" : "$";
      let source = `${prepend}(?:${state.output})${append}`;
      if (state && state.negated === true) {
        source = `^(?!${source}).*$`;
      }
      const regex = picomatch.toRegex(source, options);
      if (returnState === true) {
        regex.state = state;
      }
      return regex;
    };
    picomatch.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
      if (!input || typeof input !== "string") {
        throw new TypeError("Expected a non-empty string");
      }
      let parsed = { negated: false, fastpaths: true };
      if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) {
        parsed.output = parse.fastpaths(input, options);
      }
      if (!parsed.output) {
        parsed = parse(input, options);
      }
      return picomatch.compileRe(parsed, options, returnOutput, returnState);
    };
    picomatch.toRegex = (source, options) => {
      try {
        const opts = options || {};
        return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
      } catch (err) {
        if (options && options.debug === true) throw err;
        return /$^/;
      }
    };
    picomatch.constants = constants2;
    module2.exports = picomatch;
  }
});

// ../../node_modules/picomatch/index.js
var require_picomatch2 = __commonJS({
  "../../node_modules/picomatch/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_picomatch();
  }
});

// ../../node_modules/micromatch/index.js
var require_micromatch = __commonJS({
  "../../node_modules/micromatch/index.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var braces = require_braces();
    var picomatch = require_picomatch2();
    var utils = require_utils2();
    var isEmptyString = (v) => v === "" || v === "./";
    var hasBraces = (v) => {
      const index = v.indexOf("{");
      return index > -1 && v.indexOf("}", index) > -1;
    };
    var micromatch3 = (list, patterns, options) => {
      patterns = [].concat(patterns);
      list = [].concat(list);
      let omit = /* @__PURE__ */ new Set();
      let keep = /* @__PURE__ */ new Set();
      let items = /* @__PURE__ */ new Set();
      let negatives = 0;
      let onResult = (state) => {
        items.add(state.output);
        if (options && options.onResult) {
          options.onResult(state);
        }
      };
      for (let i = 0; i < patterns.length; i++) {
        let isMatch = picomatch(String(patterns[i]), { ...options, onResult }, true);
        let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
        if (negated) negatives++;
        for (let item of list) {
          let matched = isMatch(item, true);
          let match = negated ? !matched.isMatch : matched.isMatch;
          if (!match) continue;
          if (negated) {
            omit.add(matched.output);
          } else {
            omit.delete(matched.output);
            keep.add(matched.output);
          }
        }
      }
      let result = negatives === patterns.length ? [...items] : [...keep];
      let matches = result.filter((item) => !omit.has(item));
      if (options && matches.length === 0) {
        if (options.failglob === true) {
          throw new Error(`No matches found for "${patterns.join(", ")}"`);
        }
        if (options.nonull === true || options.nullglob === true) {
          return options.unescape ? patterns.map((p) => p.replace(/\\/g, "")) : patterns;
        }
      }
      return matches;
    };
    micromatch3.match = micromatch3;
    micromatch3.matcher = (pattern, options) => picomatch(pattern, options);
    micromatch3.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
    micromatch3.any = micromatch3.isMatch;
    micromatch3.not = (list, patterns, options = {}) => {
      patterns = [].concat(patterns).map(String);
      let result = /* @__PURE__ */ new Set();
      let items = [];
      let onResult = (state) => {
        if (options.onResult) options.onResult(state);
        items.push(state.output);
      };
      let matches = new Set(micromatch3(list, patterns, { ...options, onResult }));
      for (let item of items) {
        if (!matches.has(item)) {
          result.add(item);
        }
      }
      return [...result];
    };
    micromatch3.contains = (str, pattern, options) => {
      if (typeof str !== "string") {
        throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
      }
      if (Array.isArray(pattern)) {
        return pattern.some((p) => micromatch3.contains(str, p, options));
      }
      if (typeof pattern === "string") {
        if (isEmptyString(str) || isEmptyString(pattern)) {
          return false;
        }
        if (str.includes(pattern) || str.startsWith("./") && str.slice(2).includes(pattern)) {
          return true;
        }
      }
      return micromatch3.isMatch(str, pattern, { ...options, contains: true });
    };
    micromatch3.matchKeys = (obj, patterns, options) => {
      if (!utils.isObject(obj)) {
        throw new TypeError("Expected the first argument to be an object");
      }
      let keys = micromatch3(Object.keys(obj), patterns, options);
      let res = {};
      for (let key of keys) res[key] = obj[key];
      return res;
    };
    micromatch3.some = (list, patterns, options) => {
      let items = [].concat(list);
      for (let pattern of [].concat(patterns)) {
        let isMatch = picomatch(String(pattern), options);
        if (items.some((item) => isMatch(item))) {
          return true;
        }
      }
      return false;
    };
    micromatch3.every = (list, patterns, options) => {
      let items = [].concat(list);
      for (let pattern of [].concat(patterns)) {
        let isMatch = picomatch(String(pattern), options);
        if (!items.every((item) => isMatch(item))) {
          return false;
        }
      }
      return true;
    };
    micromatch3.all = (str, patterns, options) => {
      if (typeof str !== "string") {
        throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
      }
      return [].concat(patterns).every((p) => picomatch(p, options)(str));
    };
    micromatch3.capture = (glob2, input, options) => {
      let posix = utils.isWindows(options);
      let regex = picomatch.makeRe(String(glob2), { ...options, capture: true });
      let match = regex.exec(posix ? utils.toPosixSlashes(input) : input);
      if (match) {
        return match.slice(1).map((v) => v === void 0 ? "" : v);
      }
    };
    micromatch3.makeRe = (...args) => picomatch.makeRe(...args);
    micromatch3.scan = (...args) => picomatch.scan(...args);
    micromatch3.parse = (patterns, options) => {
      let res = [];
      for (let pattern of [].concat(patterns || [])) {
        for (let str of braces(String(pattern), options)) {
          res.push(picomatch.parse(str, options));
        }
      }
      return res;
    };
    micromatch3.braces = (pattern, options) => {
      if (typeof pattern !== "string") throw new TypeError("Expected a string");
      if (options && options.nobrace === true || !hasBraces(pattern)) {
        return [pattern];
      }
      return braces(pattern, options);
    };
    micromatch3.braceExpand = (pattern, options) => {
      if (typeof pattern !== "string") throw new TypeError("Expected a string");
      return micromatch3.braces(pattern, { ...options, expand: true });
    };
    micromatch3.hasBraces = hasBraces;
    module2.exports = micromatch3;
  }
});

// dist/cli.js
var cli_exports = {};
__export(cli_exports, {
  runViolationsCommand: () => main
});
module.exports = __toCommonJS(cli_exports);
var import_promises5 = require("node:fs/promises");
var import_node_fs10 = require("node:fs");
var import_node_child_process5 = require("node:child_process");
var import_node_path9 = require("node:path");
var import_node_url3 = require("node:url");

// ../../node_modules/@wadeck-app/shared-cli/dist/ConfigDir.js
var fs = __toESM(require("node:fs"), 1);
var os = __toESM(require("node:os"), 1);
var path = __toESM(require("node:path"), 1);
var ConfigDir = class _ConfigDir {
  // Always uses ~/.config/<appName> (XDG on Linux/macOS, same convention on Windows).
  // XDG_CONFIG_HOME is respected if set.
  static get(appName) {
    const xdg = process.env["XDG_CONFIG_HOME"];
    if (xdg)
      return path.join(xdg, appName);
    return path.join(os.homedir(), ".config", appName);
  }
  // One-time migration from legacy paths to ~/.config/<appName>.
  // Checks %APPDATA%\<appName> (Windows legacy) and ~/.<appName> (old dot-dir pattern).
  static migrateIfNeeded(appName) {
    const newDir = _ConfigDir.get(appName);
    if (fs.existsSync(newDir))
      return;
    const candidates = [];
    const appData = process.env["APPDATA"];
    if (appData)
      candidates.push(path.join(appData, appName));
    candidates.push(path.join(os.homedir(), `.${appName}`));
    for (const oldDir of candidates) {
      if (fs.existsSync(oldDir)) {
        try {
          fs.mkdirSync(path.dirname(newDir), { recursive: true });
          fs.renameSync(oldDir, newDir);
          process.stderr.write(`[${appName}] Config migrated: ${oldDir} \u2192 ${newDir}
`);
        } catch (err) {
          process.stderr.write(`[${appName}] Config migration failed (${err.message}). Your config remains at: ${oldDir}
`);
        }
        return;
      }
    }
  }
};

// ../../node_modules/@wadeck-app/shared-cli/dist/HookDispatcher.js
var import_node_child_process = require("node:child_process");
var import_node_util = require("node:util");
var execFileAsync = (0, import_node_util.promisify)(import_node_child_process.execFile);

// ../../node_modules/@wadeck-app/shared-cli/dist/UpdateManager.js
var import_node_child_process2 = require("node:child_process");
var fs2 = __toESM(require("node:fs"), 1);
var path2 = __toESM(require("node:path"), 1);
var UpdateManager = class {
  configDir;
  pkgName;
  constructor(pkgName, configDir) {
    this.pkgName = pkgName;
    this.configDir = configDir ?? ConfigDir.get(pkgName.replace(/^@[^/]+\//, "").replace(/-cli$/, ""));
  }
  // Prefer the named updater; fall back to flow-updater.cjs (shared bundle handles both CLIs via UPDATER_PKG_NAME).
  scheduleBackgroundUpdate(bundlePath, updaterName = "flow-updater.cjs") {
    const dir = path2.dirname(bundlePath);
    const updaterPath = fs2.existsSync(path2.join(dir, updaterName)) ? path2.join(dir, updaterName) : fs2.existsSync(path2.join(dir, "flow-updater.cjs")) ? path2.join(dir, "flow-updater.cjs") : null;
    if (!updaterPath)
      return;
    const child = (0, import_node_child_process2.spawn)(process.execPath, [updaterPath], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: { ...process.env, LAUNCHER_BUNDLE_OVERRIDE: bundlePath, UPDATER_PKG_NAME: this.pkgName }
    });
    child.unref();
  }
  readAndClearState() {
    const stateFile = path2.join(this.configDir, "update-state.json");
    try {
      const raw = fs2.readFileSync(stateFile, "utf-8");
      const state = JSON.parse(raw);
      if (state.status === "update-failed")
        state.status = "failed";
      if (!state.targetVersion && state.newVersion)
        state.targetVersion = state.newVersion;
      if (!state.error && state.reason)
        state.error = state.reason;
      if (state.status !== "applying") {
        try {
          fs2.unlinkSync(stateFile);
        } catch {
        }
      }
      return state;
    } catch {
      return null;
    }
  }
};

// ../../node_modules/@wadeck-app/shared-cli/dist/CliLogger.js
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
function logCliInvocation(configDir, cmdName, args) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const logFile = (0, import_node_path.join)(configDir, "logs", `${today}.ndjson`);
  (0, import_node_fs.mkdirSync)((0, import_node_path.dirname)(logFile), { recursive: true });
  const line = JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), level: "info", msg: `cmd: ${cmdName} ${args.join(" ")}`.trimEnd() });
  (0, import_node_fs.appendFileSync)(logFile, line + "\n");
}

// ../../node_modules/@wadeck-app/shared-cli/dist/CliMetaCommands.js
var import_node_fs3 = require("node:fs");
var import_node_path3 = require("node:path");
var import_node_child_process4 = require("node:child_process");

// ../../node_modules/@wadeck-app/shared-cli/dist/NpmRunner.js
var import_node_child_process3 = require("node:child_process");
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");
var NPM_CLI_JS = (0, import_node_path2.join)((0, import_node_path2.dirname)(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
var USE_NPM_CLI = (0, import_node_fs2.existsSync)(NPM_CLI_JS);
function execNpm(args, opts = {}) {
  const spawnOpts = { encoding: "utf8", windowsHide: true, ...opts };
  if (USE_NPM_CLI) {
    return (0, import_node_child_process3.execFileSync)(process.execPath, [NPM_CLI_JS, ...args], spawnOpts);
  }
  return (0, import_node_child_process3.execSync)(["npm", ...args.map((a) => JSON.stringify(a))].join(" "), spawnOpts);
}

// ../../node_modules/@wadeck-app/shared-cli/dist/CliMetaCommands.js
function warnUnknownArgs(rawArgs, knownArgs, cmdName) {
  const unknown = rawArgs.filter((a) => !knownArgs.includes(a));
  for (const arg of unknown) {
    process.stderr.write(`[warning] ${cmdName}: unknown argument '${arg}' \u2014 ignored
`);
  }
}
async function cliLogsCommand(configDir, opts = {}) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const logFile = (0, import_node_path3.join)(configDir, "logs", `${today}.ndjson`);
  if (!(0, import_node_fs3.existsSync)(logFile)) {
    process.stdout.write(`No log file for today: ${logFile}
`);
    if (!opts.follow)
      return;
  }
  let offset = 0;
  if ((0, import_node_fs3.existsSync)(logFile)) {
    const content = (0, import_node_fs3.readFileSync)(logFile, "utf8");
    process.stdout.write(content);
    offset = Buffer.byteLength(content, "utf8");
  }
  if (!opts.follow)
    return;
  await new Promise((resolve4) => {
    (0, import_node_fs3.watchFile)(logFile, { interval: 250 }, () => {
      if (!(0, import_node_fs3.existsSync)(logFile))
        return;
      const size = (0, import_node_fs3.statSync)(logFile).size;
      if (size <= offset)
        return;
      const buf = Buffer.alloc(size - offset);
      const fd = (0, import_node_fs3.openSync)(logFile, "r");
      (0, import_node_fs3.readSync)(fd, buf, 0, buf.length, offset);
      (0, import_node_fs3.closeSync)(fd);
      offset = size;
      process.stdout.write(buf.toString("utf8"));
    });
    process.on("SIGINT", () => {
      (0, import_node_fs3.unwatchFile)(logFile);
      resolve4();
    });
  });
}
async function cliVersionCommand(pkgName, current, channel = "latest") {
  let latest;
  try {
    latest = execNpm(["view", pkgName, `dist-tags.${channel}`], { timeout: 15e3 }).trim();
  } catch {
    process.stderr.write(`Failed to fetch latest version for ${pkgName}
`);
    return;
  }
  if (latest === current) {
    process.stdout.write(`${pkgName}@${current} is up to date
`);
  } else {
    process.stdout.write(`${pkgName}: current=${current} latest=${latest} (channel: ${channel})
`);
  }
}
async function cliUpdateCommand(updaterPath, pkgName, opts) {
  if (opts?.rawArgs?.includes("--force")) {
    process.stderr.write(`[warning] --force is not needed \u2014 'cli update' always checks immediately
`);
  }
  if (!(0, import_node_fs3.existsSync)(updaterPath)) {
    process.stderr.write(`Updater not found: ${updaterPath}
`);
    process.exit(1);
  }
  process.stdout.write(`Running updater for ${pkgName}...
`);
  await new Promise((resolve4, reject) => {
    const child = (0, import_node_child_process4.spawn)(process.execPath, [updaterPath], {
      env: { ...process.env, UPDATER_FORCE: "1" },
      stdio: "inherit",
      windowsHide: true
    });
    child.on("close", (code) => code === 0 ? resolve4() : reject(new Error(`Updater exited with code ${code}`)));
  });
}

// ../../node_modules/@wadeck-app/shared-cli/dist/ChannelConfig.js
var import_node_fs4 = require("node:fs");
var import_node_path4 = require("node:path");
function readChannelFromConfig(configDir) {
  const configFile = (0, import_node_path4.join)(configDir, "config.yml");
  if (!(0, import_node_fs4.existsSync)(configFile))
    return "latest";
  const raw = (0, import_node_fs4.readFileSync)(configFile, "utf8");
  return raw.match(/^channel:\s*(\S+)/m)?.[1] ?? "latest";
}

// dist/config.js
var fs3 = __toESM(require("node:fs"), 1);
var path3 = __toESM(require("node:path"), 1);
var DEFAULTS = {
  update: {
    channel: "edge",
    checkInterval: "30m",
    disabled: false
  }
};
function loadUserConfig(configDir) {
  const resolvedDir = configDir ?? ConfigDir.get("violations");
  const configFile = path3.join(resolvedDir, "config.yml");
  if (!fs3.existsSync(configFile))
    return DEFAULTS;
  try {
    const raw = fs3.readFileSync(configFile, "utf-8");
    const channelMatch = /^\s*channel:\s*['"]?(\S+?)['"]?\s*$/m.exec(raw);
    const intervalMatch = /^\s*checkInterval:\s*['"]?(\S+?)['"]?\s*$/m.exec(raw);
    const disabledMatch = /^\s*disabled:\s*(true|false)\s*$/m.exec(raw);
    return {
      update: {
        channel: channelMatch?.[1] ?? DEFAULTS.update.channel,
        checkInterval: intervalMatch?.[1] ?? DEFAULTS.update.checkInterval,
        disabled: disabledMatch?.[1] === "true"
      }
    };
  } catch {
    process.stderr.write(`[violations] Warning: failed to read ${configFile}, using defaults.
`);
    return DEFAULTS;
  }
}

// dist/version.js
var VERSION = "2026.08.30-125501-66-6468870a" ? "2026.08.30-125501-66-6468870a" : readBaseVersion();

// dist/runner.js
var import_promises3 = require("node:fs/promises");
var import_node_path7 = require("node:path");
var import_node_url2 = require("node:url");
var import_node_fs7 = require("node:fs");
var import_micromatch2 = __toESM(require_micromatch(), 1);

// dist/walk.js
var import_promises = require("node:fs/promises");
var import_node_path5 = require("node:path");
var import_micromatch = __toESM(require_micromatch(), 1);
var DEFAULT_EXCLUDE_GLOBS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.turbo/**",
  "**/.cache/**",
  "**/generated/**"
];
async function walk(dir, options) {
  const allExcludes = [...DEFAULT_EXCLUDE_GLOBS, ...options.excludeGlobs ?? []];
  const results = [];
  async function visit(current) {
    let entries;
    try {
      entries = await (0, import_promises.readdir)(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = (0, import_node_path5.join)(current, entry.name);
      const rel = (0, import_node_path5.relative)(dir, full).split("\\").join("/");
      if (import_micromatch.default.isMatch(rel, allExcludes))
        continue;
      if (entry.isDirectory()) {
        await visit(full);
      } else if (entry.isFile()) {
        if (options.extensions.length > 0 && !options.extensions.some((ext) => entry.name.endsWith(ext)))
          continue;
        results.push(full.split("\\").join("/"));
      }
    }
  }
  await visit(dir);
  return results;
}

// dist/suppress.js
var import_node_fs5 = require("node:fs");
var CACHE = /* @__PURE__ */ new Map();
function getLines(absPath) {
  if (CACHE.has(absPath))
    return CACHE.get(absPath);
  let lines;
  try {
    lines = (0, import_node_fs5.readFileSync)(absPath, "utf8").split(/\r?\n/);
  } catch {
    lines = [];
  }
  CACHE.set(absPath, lines);
  return lines;
}
function parseSuppress(line) {
  if (!line)
    return null;
  const match = line.match(/(?:\/\/|\{?\/\*|#|<!--)\s*violations-suppress:\s*([a-z0-9,/\-]+)(?:\s+(.*))?(?:\*\/\}?|-->)?$/i);
  if (!match)
    return null;
  const ruleIds = match[1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const reasonRaw = (match[2] ?? "").replace(/\*\/|-->$/, "").trim();
  return { ruleIds, reason: reasonRaw || void 0 };
}
function parseSuppressStart(line) {
  if (!line)
    return null;
  const match = line.match(/(?:\/\/|\{?\/\*|#|<!--)\s*violations-suppress-start:\s*([a-z0-9,/\-]+)(?:\s.*)?(?:\*\/\}?|-->)?$/i);
  if (!match)
    return null;
  return match[1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}
function parseSuppressEnd(line) {
  if (!line)
    return null;
  const match = line.match(/(?:\/\/|\{?\/\*|#|<!--)\s*violations-suppress-end:\s*([a-z0-9,/\-]+)(?:\s.*)?(?:\*\/\}?|-->)?$/i);
  if (!match)
    return null;
  return match[1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}
function isSuppressed(absPath, lineNumber, ruleId) {
  if (!lineNumber)
    return false;
  const id = ruleId.toLowerCase();
  const lines = getLines(absPath);
  const sameLine = parseSuppress(lines[lineNumber - 1] ?? "");
  if (sameLine && sameLine.ruleIds.includes(id))
    return true;
  const above = parseSuppress(lines[lineNumber - 2] ?? "");
  if (above && above.ruleIds.includes(id))
    return true;
  for (let i = lineNumber - 2; i >= 0; i--) {
    const endIds = parseSuppressEnd(lines[i] ?? "");
    if (endIds && endIds.includes(id))
      break;
    const startIds = parseSuppressStart(lines[i] ?? "");
    if (startIds && startIds.includes(id))
      return true;
  }
  return false;
}
function getSuppressReason(absPath, lineNumber) {
  if (!lineNumber)
    return void 0;
  const lines = getLines(absPath);
  const sameLine = parseSuppress(lines[lineNumber - 1] ?? "");
  if (sameLine)
    return sameLine.reason;
  const above = parseSuppress(lines[lineNumber - 2] ?? "");
  if (above)
    return above.reason;
  return void 0;
}

// dist/compiler.js
var import_promises2 = require("node:fs/promises");
var import_node_path6 = require("node:path");
var import_node_url = require("node:url");
var import_node_fs6 = require("node:fs");
var import_node_crypto = require("node:crypto");
var import_typescript = __toESM(require("typescript"), 1);
async function readManifest(manifestPath) {
  try {
    const raw = await (0, import_promises2.readFile)(manifestPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return { frameworkVersion: "", files: {} };
  }
}
async function writeManifest(manifestPath, manifest) {
  const tmp = manifestPath + "." + (0, import_node_crypto.randomBytes)(6).toString("hex") + ".tmp";
  await (0, import_promises2.writeFile)(tmp, JSON.stringify(manifest, null, 2), "utf8");
  await (0, import_promises2.rename)(tmp, manifestPath);
}
async function compileIfNeeded(sourcePath, outputPath, manifestPath, frameworkVersion) {
  const manifest = await readManifest(manifestPath);
  if (manifest.frameworkVersion !== frameworkVersion) {
    manifest.files = {};
    manifest.frameworkVersion = frameworkVersion;
  }
  const entry = manifest.files[sourcePath];
  let sourceMtime;
  try {
    const s = await (0, import_promises2.stat)(sourcePath);
    sourceMtime = s.mtimeMs;
  } catch {
    throw new Error(`Source file not found: ${sourcePath}`);
  }
  const compiledExists = (0, import_node_fs6.existsSync)(outputPath);
  if (entry && entry.mtimeMs === sourceMtime && compiledExists) {
    return;
  }
  const source = await (0, import_promises2.readFile)(sourcePath, "utf8");
  const result = import_typescript.default.transpileModule(source, {
    compilerOptions: {
      module: import_typescript.default.ModuleKind.ESNext,
      target: import_typescript.default.ScriptTarget.ES2022,
      moduleResolution: import_typescript.default.ModuleResolutionKind.Bundler,
      esModuleInterop: true
    },
    fileName: sourcePath
  });
  const srcDir = (0, import_node_path6.dirname)(sourcePath);
  const rewritten = result.outputText.replace(/from\s+['"](\.[^'"]+)['"]/g, (_, rel) => `from '${(0, import_node_url.pathToFileURL)((0, import_node_path6.resolve)(srcDir, rel)).href}'`);
  await (0, import_promises2.mkdir)((0, import_node_path6.dirname)(outputPath), { recursive: true });
  await (0, import_promises2.writeFile)(outputPath, rewritten, "utf8");
  manifest.files[sourcePath] = { mtimeMs: sourceMtime, compiledPath: outputPath };
  await (0, import_promises2.mkdir)((0, import_node_path6.dirname)(manifestPath), { recursive: true });
  await writeManifest(manifestPath, manifest);
}
async function typeCheck(sourcePath) {
  const source = await (0, import_promises2.readFile)(sourcePath, "utf8");
  const sourceFile = import_typescript.default.createSourceFile(sourcePath, source, import_typescript.default.ScriptTarget.ES2022, true);
  const defaultCompilerHost = import_typescript.default.createCompilerHost({});
  const customHost = {
    ...defaultCompilerHost,
    getSourceFile: (fileName, langVersion) => {
      if (fileName === sourcePath)
        return sourceFile;
      return defaultCompilerHost.getSourceFile(fileName, langVersion);
    }
  };
  const program = import_typescript.default.createProgram([sourcePath], {
    noEmit: true,
    strict: true,
    module: import_typescript.default.ModuleKind.ESNext,
    target: import_typescript.default.ScriptTarget.ES2022
  }, customHost);
  const diagnostics = import_typescript.default.getPreEmitDiagnostics(program);
  const errors = [];
  for (const diag of diagnostics) {
    if (diag.file && diag.start !== void 0) {
      const { line } = diag.file.getLineAndCharacterOfPosition(diag.start);
      errors.push(`${diag.file.fileName}:${line + 1}: ${import_typescript.default.flattenDiagnosticMessageText(diag.messageText, "\n")}`);
    } else {
      errors.push(import_typescript.default.flattenDiagnosticMessageText(diag.messageText, "\n"));
    }
  }
  return { errors };
}

// dist/runner.js
var __dirname = (0, import_node_path7.dirname)((0, import_node_url2.fileURLToPath)(__importMetaUrl));
async function getFrameworkVersion() {
  try {
    const pkgPath = (0, import_node_path7.join)(__dirname, "..", "package.json");
    const raw = await (0, import_promises3.readFile)(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}
async function loadConfig(projectRoot, frameworkVersion) {
  const configTs = (0, import_node_path7.join)(projectRoot, ".violations", "config.ts");
  const cacheDir = (0, import_node_path7.join)(projectRoot, ".violations", ".cache");
  const configJs = (0, import_node_path7.join)(cacheDir, "config.js");
  const manifestPath = (0, import_node_path7.join)(cacheDir, "manifest.json");
  if ((0, import_node_fs7.existsSync)(configTs)) {
    await compileIfNeeded(configTs, configJs, manifestPath, frameworkVersion);
    const mod = await import((0, import_node_url2.pathToFileURL)(configJs).href + "?t=" + Date.now());
    return mod.default;
  }
  const configJs2 = (0, import_node_path7.join)(projectRoot, ".violations", "config.js");
  if ((0, import_node_fs7.existsSync)(configJs2)) {
    const mod = await import((0, import_node_url2.pathToFileURL)(configJs2).href + "?t=" + Date.now());
    return mod.default;
  }
  throw new Error(`No .violations/config.ts or config.js found in ${projectRoot}`);
}
async function loadRule(ruleKey, projectRoot, cacheDir, manifestPath, frameworkVersion) {
  const isLocal = ruleKey.startsWith("./") || ruleKey.startsWith("../");
  if (isLocal) {
    const resolvedBase = (0, import_node_path7.resolve)(projectRoot, ruleKey);
    let importPath = resolvedBase;
    if ((0, import_node_path7.extname)(resolvedBase) === ".ts") {
      const compiled = (0, import_node_path7.join)(cacheDir, "rules", (0, import_node_path7.basename)(resolvedBase, ".ts") + ".js");
      await compileIfNeeded(resolvedBase, compiled, manifestPath, frameworkVersion);
      importPath = compiled;
    }
    try {
      const mod = await import((0, import_node_url2.pathToFileURL)(importPath).href + "?t=" + Date.now());
      return mod.default ?? mod.rule ?? null;
    } catch (err) {
      console.warn(`[violations] Failed to load local rule ${ruleKey}: ${String(err)}`);
      return null;
    }
  }
  try {
    const mod = await import(`@wadeck-app/violations-rules/rules/${ruleKey}`);
    return mod.default ?? mod.rule ?? null;
  } catch {
    console.warn(`[violations] Package rule '${ruleKey}' not found -- skipping (will be available in Phase 4)`);
    return null;
  }
}
function stripMetaFields(override) {
  const { $severity: _s, $scopeAdd: _a, $exclude: _e, ...rest } = override;
  return rest;
}
async function run(options) {
  const { projectRoot } = options;
  const frameworkVersion = await getFrameworkVersion();
  const config = options.overrideConfig ?? await loadConfig(projectRoot, frameworkVersion);
  const cacheDir = (0, import_node_path7.join)(projectRoot, ".violations", ".cache");
  const manifestPath = (0, import_node_path7.join)(cacheDir, "manifest.json");
  await (0, import_promises3.mkdir)(cacheDir, { recursive: true });
  const rulesConfig = config.rules ?? {};
  const results = [];
  const { allRules } = await import("@wadeck-app/violations-rules");
  const projectTags = new Set(config.projectTags ?? []);
  const mergedRules = {};
  for (const libRule of allRules) {
    const ruleTags = Array.isArray(libRule.tags) ? libRule.tags : [libRule.tags];
    if (libRule.alwaysActive || ruleTags.some((t) => projectTags.has(t))) {
      mergedRules[libRule.id] = true;
    }
  }
  for (const [key, val] of Object.entries(rulesConfig)) {
    mergedRules[key] = val;
  }
  const activeRuleIds = Object.entries(mergedRules).filter(([, override]) => !(override !== true && override != null && override.$severity === false)).filter(([ruleKey]) => !ruleKey.startsWith("./") && !ruleKey.startsWith("../")).map(([ruleKey]) => ruleKey);
  await Promise.all(Object.entries(mergedRules).map(async ([ruleKey, override]) => {
    if (override !== true && override != null && override.$severity === false) {
      return;
    }
    const rule = await loadRule(ruleKey, projectRoot, cacheDir, manifestPath, frameworkVersion);
    if (!rule)
      return;
    const effectiveSeverity = override !== true && override != null && override.$severity != null ? override.$severity : rule.defaultSeverity;
    const scopePatterns = [
      ...rule.defaultScope,
      ...override !== true && override != null ? override.$scopeAdd ?? [] : []
    ];
    const excludePatterns = [
      ...config.globalExclude ?? [],
      ...override !== true && override != null ? override.$exclude ?? [] : []
    ];
    let walkedFiles = await walk(projectRoot, {
      extensions: [],
      excludeGlobs: excludePatterns
    });
    walkedFiles = walkedFiles.filter((absPath) => {
      const rel = absPath.replace(projectRoot.split("\\").join("/") + "/", "").replace(/^\//, "");
      return import_micromatch2.default.isMatch(rel, scopePatterns);
    });
    if (options.files && options.files.length > 0) {
      const filesSet = new Set(options.files.map((f) => f.split("\\").join("/")));
      walkedFiles = walkedFiles.filter((f) => filesSet.has(f));
    }
    if (walkedFiles.length === 0) {
      results.push({
        ruleId: rule.id,
        severity: effectiveSeverity,
        violations: [],
        suppressed: [],
        counts: { violations: 0, suppressed: 0 }
      });
      return;
    }
    const ruleConfig = override !== true && override != null ? stripMetaFields(override) : {};
    if (rule.id === "shared/no-dead-suppress") {
      ruleConfig.activeRuleIds = activeRuleIds;
    }
    let violations;
    try {
      violations = await rule.check(walkedFiles, ruleConfig);
    } catch (err) {
      console.warn(`[violations] Rule ${rule.id} threw: ${String(err)}`);
      violations = [];
    }
    const active = [];
    const suppressed = [];
    for (const v of violations) {
      if (isSuppressed(v.file, v.line, rule.id)) {
        const reason = getSuppressReason(v.file, v.line);
        suppressed.push(reason ? { ...v, message: reason } : v);
      } else {
        active.push(v);
      }
    }
    results.push({
      ruleId: rule.id,
      severity: effectiveSeverity,
      violations: active,
      suppressed,
      counts: { violations: active.length, suppressed: suppressed.length }
    });
  }));
  return results;
}

// dist/report.js
var import_promises4 = require("node:fs/promises");
var import_node_path8 = require("node:path");
var import_node_fs8 = require("node:fs");
async function ensureGitignore(dotViolationsDir) {
  const gitignorePath = (0, import_node_path8.join)(dotViolationsDir, ".gitignore");
  if (!(0, import_node_fs8.existsSync)(gitignorePath)) {
    await (0, import_promises4.writeFile)(gitignorePath, ".cache/\n.reports/\n", "utf8");
  }
}
async function writeReports(dotViolationsDir, results) {
  const reportsDir = (0, import_node_path8.join)(dotViolationsDir, ".reports");
  await (0, import_promises4.mkdir)(reportsDir, { recursive: true });
  await ensureGitignore(dotViolationsDir);
  const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const totalViolations = results.reduce((s, r) => s + r.counts.violations, 0);
  const totalSuppressed = results.reduce((s, r) => s + r.counts.suppressed, 0);
  const json = {
    generatedAt,
    totalViolations,
    rules: results.map((r) => ({
      id: r.ruleId,
      severity: r.severity,
      violations: r.violations
    }))
  };
  const reportJsonPath = (0, import_node_path8.join)(reportsDir, "report.json");
  await (0, import_promises4.writeFile)(reportJsonPath, JSON.stringify(json, null, 2), "utf8");
  const suppressedJson = {
    generatedAt,
    totalSuppressed,
    rules: results.filter((r) => r.counts.suppressed > 0).map((r) => ({ id: r.ruleId, severity: r.severity, suppressed: r.suppressed }))
  };
  const suppressedJsonPath = (0, import_node_path8.join)(reportsDir, "suppressed.json");
  await (0, import_promises4.writeFile)(suppressedJsonPath, JSON.stringify(suppressedJson, null, 2), "utf8");
  const mdLines = [];
  mdLines.push("# Violations report");
  mdLines.push("");
  mdLines.push(`Generated: ${generatedAt}`);
  mdLines.push(`Total violations: ${totalViolations}`);
  mdLines.push("");
  for (const r of results) {
    const count = r.counts.violations;
    mdLines.push(`## ${r.ruleId} [${r.severity}] (${count} violation${count === 1 ? "" : "s"})`);
    mdLines.push("");
    if (count === 0) {
      mdLines.push("- (clean)");
    } else {
      for (const v of r.violations) {
        mdLines.push(`- ${v.line ? `${v.file}:${v.line}` : v.file}: ${v.message}`);
      }
    }
    mdLines.push("");
  }
  const reportPath = (0, import_node_path8.join)(reportsDir, "report.md");
  await (0, import_promises4.writeFile)(reportPath, mdLines.join("\n"), "utf8");
  const supLines = [];
  supLines.push("# Suppressed violations (audit)");
  supLines.push("");
  supLines.push(`Generated: ${generatedAt}`);
  supLines.push(`Total suppressed: ${totalSuppressed}`);
  supLines.push("");
  for (const r of results) {
    if (r.counts.suppressed === 0)
      continue;
    supLines.push(`## ${r.ruleId} (${r.counts.suppressed} suppressed)`);
    supLines.push("");
    for (const v of r.suppressed) {
      const loc = v.line ? `${v.file}:${v.line}` : v.file;
      supLines.push(`- ${loc}: ${v.message}`);
    }
    supLines.push("");
  }
  const suppressedPath = (0, import_node_path8.join)(reportsDir, "suppressed.md");
  await (0, import_promises4.writeFile)(suppressedPath, supLines.join("\n"), "utf8");
  return { reportPath, suppressedPath };
}

// dist/selfCheck.js
var import_node_fs9 = require("node:fs");
var import_node_module = require("node:module");
var _require = (0, import_node_module.createRequire)(__importMetaUrl);
function checkBundleVersion() {
  try {
    const v = "2026.08.30-125501-66-6468870a";
    if (!v) {
      return { name: "bundle-version", ok: false, reason: "version string is empty" };
    }
    return { name: "bundle-version", ok: true };
  } catch {
    return { name: "bundle-version", ok: false, reason: "not bundled (dev build)" };
  }
}
function checkConfigDirWritable() {
  try {
    const dir = process.env["VIOLATIONS_CONFIG_DIR"] ?? ConfigDir.get("violations");
    (0, import_node_fs9.mkdirSync)(dir, { recursive: true });
    (0, import_node_fs9.accessSync)(dir, import_node_fs9.constants.W_OK);
    return { name: "config-dir-writable", ok: true };
  } catch (err) {
    return { name: "config-dir-writable", ok: false, reason: String(err) };
  }
}
function checkTypeScriptApi() {
  try {
    _require.resolve("typescript");
    return { name: "typescript-api", ok: true };
  } catch (err) {
    return { name: "typescript-api", ok: false, reason: String(err) };
  }
}
function runSelfChecks() {
  return [checkBundleVersion(), checkConfigDirWritable(), checkTypeScriptApi()];
}
function printSelfChecks(results) {
  const quiet = process.env["CLI_SELF_CHECK_QUIET"] === "1";
  for (const r of results) {
    if (r.ok) {
      if (!quiet) {
        process.stderr.write(`[ok] ${r.name}
`);
      }
    } else {
      process.stderr.write(`[fail] ${r.name}: ${r.reason ?? "unknown"}
`);
    }
  }
}

// dist/cli.js
var __dirname2 = (0, import_node_path9.dirname)((0, import_node_url3.fileURLToPath)(__importMetaUrl));
var RULES_GROUP_HELP = `violations rules - manage violation rules

Usage:
  violations rules list [--tag <tag>]
  violations rules info <id>
  violations rules create <name> --lang ts|js
`;
var CONFIG_GROUP_HELP = `violations config - manage project configuration

Usage:
  violations config validate
`;
var CACHE_GROUP_HELP = `violations cache - manage compilation cache

Usage:
  violations cache clear
`;
var CLI_GROUP_HELP = `violations cli - CLI tooling commands

Usage:
  violations cli self-check
  violations cli update
  violations cli logs [-f/--follow]
`;
function printUsage() {
  console.log(`violations - code quality rule runner

Usage:
  violations check [--staged] [--files a,b,c]
  violations test [--local] [--rule <id>]
  violations rules list [--tag <tag>]
  violations rules info <id>
  violations rules create <name> --lang ts|js
  violations config validate
  violations cache clear
  violations cli self-check
  violations cli update

Exit codes:
  0  ok
  1  error
  N  violation count (check)

Env vars:
  VIOLATIONS_CONFIG_DIR   override the config directory
  CLI_SELF_CHECK_QUIET    set to 1 to suppress [ok] lines in self-check
`);
}
function getProjectRoot() {
  return process.cwd();
}
function getDotViolationsDir(projectRoot) {
  return (0, import_node_path9.join)(projectRoot, ".violations");
}
async function getPackageVersion() {
  try {
    const pkgPath = (0, import_node_path9.join)(__dirname2, "..", "package.json");
    const raw = await (0, import_promises5.readFile)(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}
function formatViolations(results) {
  const lines = [];
  let errors = 0;
  let warnings = 0;
  for (const result of results) {
    for (const v of result.violations) {
      const loc = v.line ? `${v.file}:${v.line}` : v.file;
      lines.push(`${loc}  ${v.message}  [${result.ruleId}]`);
      if (result.severity === "error")
        errors++;
      else if (result.severity === "warning")
        warnings++;
    }
  }
  return { lines, errors, warnings };
}
async function buildDefaultConfig(projectRoot) {
  const { readdir: readdir2 } = await import("node:fs/promises");
  const hasFileWithExt = async (dir, ext) => {
    try {
      const entries = await readdir2(dir, { withFileTypes: true });
      return entries.some((e) => e.isFile() && e.name.endsWith(ext) && !e.name.endsWith(".d.ts"));
    } catch {
      return false;
    }
  };
  const srcDir = (0, import_node_path9.join)(projectRoot, "src");
  const [hasTsInSrc, hasTsInRoot, hasTsxInSrc, hasTsxInRoot] = await Promise.all([
    hasFileWithExt(srcDir, ".ts"),
    hasFileWithExt(projectRoot, ".ts"),
    hasFileWithExt(srcDir, ".tsx"),
    hasFileWithExt(projectRoot, ".tsx")
  ]);
  const projectTags = ["shared"];
  if (hasTsInSrc || hasTsInRoot)
    projectTags.push("ts");
  if (hasTsxInSrc || hasTsxInRoot)
    projectTags.push("react");
  return {
    projectTags,
    globalExclude: ["node_modules/**", "dist/**", "dist-bundle/**", ".violations/**"],
    rules: {}
  };
}
async function cmdCheck(args) {
  const projectRoot = getProjectRoot();
  const dotViolationsDir = getDotViolationsDir(projectRoot);
  const configTs = (0, import_node_path9.join)(dotViolationsDir, "config.ts");
  const configJs = (0, import_node_path9.join)(dotViolationsDir, "config.js");
  let staged = false;
  let files;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--staged") {
      staged = true;
    } else if (args[i] === "--files" && args[i + 1]) {
      files = args[i + 1].split(",").map((f) => f.trim());
      i++;
    } else if (args[i]?.startsWith("--files=")) {
      files = args[i].slice("--files=".length).split(",").map((f) => f.trim());
    }
  }
  let overrideConfig;
  if (!(0, import_node_fs10.existsSync)(configTs) && !(0, import_node_fs10.existsSync)(configJs)) {
    overrideConfig = await buildDefaultConfig(projectRoot);
    process.stderr.write("[auto] No .violations/config.ts found - running with auto-detected defaults.\n");
  }
  const results = await run({ projectRoot, staged, files, overrideConfig });
  await writeReports(dotViolationsDir, results);
  const { lines, errors, warnings } = formatViolations(results);
  const totalViolations = results.reduce((s, r) => s + r.counts.violations, 0);
  for (const line of lines) {
    console.log(line);
  }
  if (totalViolations === 0) {
    console.log("[ok] 0 violations");
  } else {
    const parts = [];
    if (errors > 0)
      parts.push(`${errors} error${errors === 1 ? "" : "s"}`);
    if (warnings > 0)
      parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
    const rest = totalViolations - errors - warnings;
    if (rest > 0)
      parts.push(`${rest} info`);
    const breakdown = parts.length > 0 ? `  (${parts.join(", ")})` : "";
    console.log(`${totalViolations} violation${totalViolations === 1 ? "" : "s"}${breakdown}`);
  }
  process.exit(Math.min(totalViolations, 254));
}
async function cmdTest(args) {
  const projectRoot = getProjectRoot();
  const dotViolationsDir = getDotViolationsDir(projectRoot);
  let localOnly = false;
  let ruleId;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--local") {
      localOnly = true;
    } else if (args[i] === "--rule" && args[i + 1]) {
      ruleId = args[i + 1];
      i++;
    } else if (args[i]?.startsWith("--rule=")) {
      ruleId = args[i].slice("--rule=".length);
    }
  }
  const testFiles = [];
  if (ruleId) {
    const localPattern = (0, import_node_path9.join)(dotViolationsDir, "rules", `${ruleId}.test.*`);
    const localFiles = await glob(localPattern);
    testFiles.push(...localFiles);
    const pkgTest = (0, import_node_path9.join)(__dirname2, "..", "dist", "rules", `${ruleId}.test.js`);
    if ((0, import_node_fs10.existsSync)(pkgTest))
      testFiles.push(pkgTest);
  } else if (localOnly) {
    const localDir = (0, import_node_path9.join)(dotViolationsDir, "rules");
    if ((0, import_node_fs10.existsSync)(localDir)) {
      const found = await globDir(localDir, /\.test\.[jt]s$/);
      testFiles.push(...found);
    }
  } else {
    const pkgTestDir = (0, import_node_path9.join)(__dirname2, "..", "dist", "rules");
    if ((0, import_node_fs10.existsSync)(pkgTestDir)) {
      const found = await globDir(pkgTestDir, /\.test\.js$/);
      testFiles.push(...found);
    }
    const localDir = (0, import_node_path9.join)(dotViolationsDir, "rules");
    if ((0, import_node_fs10.existsSync)(localDir)) {
      const found = await globDir(localDir, /\.test\.[jt]s$/);
      testFiles.push(...found);
    }
  }
  if (testFiles.length === 0) {
    console.log("No test files found.");
    process.exit(0);
  }
  const cacheDir = (0, import_node_path9.join)(dotViolationsDir, ".cache");
  const manifestPath = (0, import_node_path9.join)(cacheDir, "manifest.json");
  const frameworkVersion = await getPackageVersion();
  const runnable = [];
  for (const f of testFiles) {
    if (f.endsWith(".ts")) {
      const compiled = (0, import_node_path9.join)(cacheDir, "rules", (0, import_node_path9.basename)(f, ".ts") + ".test.js");
      await compileIfNeeded(f, compiled, manifestPath, frameworkVersion);
      runnable.push(compiled);
    } else {
      runnable.push(f);
    }
  }
  let failed = false;
  for (const file of runnable) {
    const code = await new Promise((resolveP) => {
      const child = (0, import_node_child_process5.spawn)(process.execPath, ["--test", file], { stdio: "inherit" });
      child.on("close", (c) => resolveP(c ?? 1));
    });
    if (code !== 0)
      failed = true;
  }
  process.exit(failed ? 1 : 0);
}
async function globDir(dir, pattern) {
  const { readdir: readdir2 } = await import("node:fs/promises");
  const entries = await readdir2(dir, { withFileTypes: true, recursive: true });
  const results = [];
  for (const entry of entries) {
    if (entry.isFile() && pattern.test(entry.name)) {
      const parent = entry.parentPath ?? dir;
      results.push((0, import_node_path9.join)(parent, entry.name));
    }
  }
  return results;
}
async function glob(pattern) {
  if ((0, import_node_fs10.existsSync)(pattern))
    return [pattern];
  for (const ext of [".ts", ".js"]) {
    const candidate = pattern.replace(/\.\*$/, ext);
    if ((0, import_node_fs10.existsSync)(candidate))
      return [candidate];
  }
  return [];
}
async function cmdRulesList(args) {
  let tagFilter;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tag" && args[i + 1]) {
      tagFilter = args[i + 1];
      i++;
    } else if (args[i]?.startsWith("--tag=")) {
      tagFilter = args[i].slice("--tag=".length);
    }
  }
  let rules = [];
  try {
    const mod = await import("@wadeck-app/violations-rules");
    if (mod.allRules) {
      rules = mod.allRules;
    }
  } catch {
  }
  if (tagFilter) {
    rules = rules.filter((r) => r.tags === tagFilter);
  }
  if (rules.length === 0) {
    console.log("No rules loaded yet.");
    return;
  }
  const jsonMode = args.includes("--json") || !process.stdout.isTTY;
  if (jsonMode) {
    process.stdout.write(JSON.stringify(rules) + "\n");
  } else {
    for (const r of rules) {
      const id = r.id.padEnd(40);
      const tag = r.tags.padEnd(12);
      const sev = r.defaultSeverity;
      console.log(`${id} ${tag} ${sev}`);
    }
  }
}
async function cmdRulesInfo(id) {
  if (!id) {
    process.stderr.write("Usage: violations rules info <id>\n");
    process.exit(1);
  }
  let rule;
  try {
    const mod = await import(`@wadeck-app/violations-rules/rules/${id}`);
    rule = mod.default;
  } catch {
  }
  if (!rule) {
    console.log(`Rule not found: ${id}`);
    process.exit(1);
  }
  console.log(`id:              ${rule.id}`);
  console.log(`tag:             ${rule.tags}`);
  console.log(`defaultSeverity: ${rule.defaultSeverity}`);
  console.log(`defaultScope:    ${rule.defaultScope.join(", ")}`);
}
function buildRuleTemplate(name, lang) {
  if (lang === "ts") {
    return `import type { Rule, Violation } from '@wadeck-app/violations-rules'

export const rule: Rule = {
  id: 'local/${name}',
  tags: 'shared',
  defaultScope: ['**/*'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Record<never, never>): Promise<Violation[]> {
    const violations: Violation[] = []
    // TODO: implement
    return violations
  },
}

export default rule
`;
  }
  return `/** @type {import('@wadeck-app/violations-rules').Rule} */
export const rule = {
  id: 'local/${name}',
  tags: 'shared',
  defaultScope: ['**/*'],
  defaultSeverity: 'error',
  async check(files, _config) {
    /** @type {import('@wadeck-app/violations-rules').Violation[]} */
    const violations = []
    // TODO: implement
    return violations
  },
}

export default rule
`;
}
function buildTestTemplate(name, lang) {
  if (lang === "ts") {
    return `import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './${name}.js'

describe('local/${name}', () => {
  it('returns no violations for a clean file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-test-'))
    try {
      const file = join(dir, 'clean.txt')
      await writeFile(file, 'clean content\\n')
      const result = await rule.check([file], {})
      assert.equal(result.length, 0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('returns a violation for a bad file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-test-'))
    try {
      const file = join(dir, 'bad.txt')
      await writeFile(file, 'TODO: implement test fixture\\n')
      const result = await rule.check([file], {})
      // TODO: assert result.length > 0
      assert.ok(Array.isArray(result))
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
`;
  }
  return `import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './${name}.js'

describe('local/${name}', () => {
  it('returns no violations for a clean file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-test-'))
    try {
      const file = join(dir, 'clean.txt')
      await writeFile(file, 'clean content\\n')
      const result = await rule.check([file], {})
      assert.equal(result.length, 0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
`;
}
async function cmdRulesCreate(name, args) {
  if (!name) {
    process.stderr.write("Usage: violations rules create <name> --lang ts|js\n");
    process.exit(1);
  }
  let lang = "ts";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lang" && args[i + 1]) {
      const val = args[i + 1];
      if (val === "ts" || val === "js")
        lang = val;
      i++;
    } else if (args[i]?.startsWith("--lang=")) {
      const val = args[i].slice("--lang=".length);
      if (val === "ts" || val === "js")
        lang = val;
    }
  }
  const projectRoot = getProjectRoot();
  const rulesDir = (0, import_node_path9.join)(projectRoot, ".violations", "rules");
  await (0, import_promises5.mkdir)(rulesDir, { recursive: true });
  const ruleFile = (0, import_node_path9.join)(rulesDir, `${name}.${lang}`);
  const testFile = (0, import_node_path9.join)(rulesDir, `${name}.test.${lang}`);
  if ((0, import_node_fs10.existsSync)(ruleFile)) {
    process.stderr.write(`Rule already exists: ${ruleFile}
`);
    process.exit(1);
  }
  await (0, import_promises5.writeFile)(ruleFile, buildRuleTemplate(name, lang), "utf8");
  await (0, import_promises5.writeFile)(testFile, buildTestTemplate(name, lang), "utf8");
  console.log(`Created: ${ruleFile}`);
  console.log(`Created: ${testFile}`);
}
async function cmdConfigValidate() {
  const projectRoot = getProjectRoot();
  const dotViolationsDir = getDotViolationsDir(projectRoot);
  const configTs = (0, import_node_path9.join)(dotViolationsDir, "config.ts");
  if (!(0, import_node_fs10.existsSync)(configTs)) {
    process.stderr.write("[fail] No .violations/config.ts found. Run: violations rules create\n");
    process.exit(1);
  }
  const errors = [];
  const { errors: typeErrors } = await typeCheck(configTs);
  errors.push(...typeErrors);
  if (errors.length > 0) {
    process.stderr.write("[fail] TypeScript errors in config.ts:\n");
    for (const e of errors) {
      process.stderr.write(`  ${e}
`);
    }
  }
  const cacheDir = (0, import_node_path9.join)(dotViolationsDir, ".cache");
  const manifestPath = (0, import_node_path9.join)(cacheDir, "manifest.json");
  const configJs = (0, import_node_path9.join)(cacheDir, "config.js");
  const frameworkVersion = await getPackageVersion();
  try {
    await compileIfNeeded(configTs, configJs, manifestPath, frameworkVersion);
    const mod = await import((0, import_node_url3.pathToFileURL)(configJs).href + "?t=" + Date.now());
    const config = mod.default;
    const rulesConfig = config.rules ?? {};
    const ruleErrors = [];
    for (const ruleKey of Object.keys(rulesConfig)) {
      const isLocal = ruleKey.startsWith("./") || ruleKey.startsWith("../");
      if (isLocal) {
        const resolvedBase = (0, import_node_path9.resolve)(projectRoot, ruleKey);
        const resolvedTs = (0, import_node_path9.extname)(resolvedBase) === "" ? resolvedBase + ".ts" : resolvedBase;
        const resolvedJs = (0, import_node_path9.extname)(resolvedBase) === "" ? resolvedBase + ".js" : resolvedBase.replace(/\.ts$/, ".js");
        if (!(0, import_node_fs10.existsSync)(resolvedBase) && !(0, import_node_fs10.existsSync)(resolvedTs) && !(0, import_node_fs10.existsSync)(resolvedJs)) {
          ruleErrors.push(`Rule not found: ${ruleKey} (resolved to ${resolvedBase})`);
        }
      } else {
        try {
          await import(`@wadeck-app/violations-rules/rules/${ruleKey}`);
        } catch {
          ruleErrors.push(`Package rule not found: ${ruleKey} (will be available in Phase 4)`);
        }
      }
    }
    if (ruleErrors.length > 0) {
      process.stderr.write("[fail] Rule resolution errors:\n");
      for (const e of ruleErrors) {
        process.stderr.write(`  ${e}
`);
      }
      errors.push(...ruleErrors);
    }
  } catch (err) {
    errors.push(`Failed to load config: ${String(err)}`);
    process.stderr.write(`[fail] Failed to load config: ${String(err)}
`);
  }
  if (errors.length === 0) {
    console.log("[ok] config is valid.");
    process.exit(0);
  } else {
    process.exit(1);
  }
}
async function cmdCacheClear() {
  const projectRoot = getProjectRoot();
  const cacheDir = (0, import_node_path9.join)(projectRoot, ".violations", ".cache");
  if ((0, import_node_fs10.existsSync)(cacheDir)) {
    await (0, import_promises5.rm)(cacheDir, { recursive: true, force: true });
  }
  process.stdout.write("[ok] cache cleared.\n");
}
function cmdCliSelfCheck() {
  const results = runSelfChecks();
  printSelfChecks(results);
  const allPassed = results.every((r) => r.ok);
  process.exit(allPassed ? 0 : 1);
}
async function main() {
  ConfigDir.migrateIfNeeded("violations");
  const argv = process.argv.slice(2);
  try {
    logCliInvocation(ConfigDir.get("violations"), "violations", argv);
  } catch {
  }
  const updater = new UpdateManager("@wadeck-app/violations-cli");
  const updateState = updater.readAndClearState();
  if (updateState?.status === "success") {
    process.stderr.write(`[violations] Updated to v${updateState.targetVersion ?? "?"}
`);
  }
  if (updateState?.status === "rolled-back") {
    process.stderr.write(`[violations] Update to v${updateState.targetVersion ?? "?"} failed (self-check failed). Rolled back to v${updateState.previousVersion ?? "?"}.
`);
  }
  if (updateState?.status === "failed") {
    process.stderr.write(`[violations] Update failed: ${updateState.error ?? "unknown"}.
`);
  }
  const configDir = process.env["VIOLATIONS_CONFIG_DIR"] ?? ConfigDir.get("violations");
  const userConfig = loadUserConfig(configDir);
  const bundlePath = process.env["LAUNCHER_BUNDLE_OVERRIDE"] ?? (0, import_node_url3.fileURLToPath)(__importMetaUrl);
  if (argv[0] === "--version" || argv[0] === "-V") {
    console.log(VERSION);
    process.exit(0);
  }
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    printUsage();
    process.exit(0);
  }
  const command = argv[0];
  const rest = argv.slice(1);
  try {
    if (command === "check") {
      await cmdCheck(rest);
    } else if (command === "test") {
      await cmdTest(rest);
    } else if (command === "rules") {
      const sub = rest[0];
      const subRest = rest.slice(1);
      if (sub === "--help" || sub === "-h") {
        process.stdout.write(RULES_GROUP_HELP);
        process.exit(0);
      } else if (sub === "list") {
        await cmdRulesList(subRest);
      } else if (sub === "info") {
        await cmdRulesInfo(subRest[0]);
      } else if (sub === "create") {
        await cmdRulesCreate(subRest[0], subRest.slice(1));
      } else {
        process.stderr.write(`[fail] Unknown subcommand: rules ${sub ?? ""}
Run: violations rules --help
`);
        process.exit(1);
      }
    } else if (command === "config") {
      const sub = rest[0];
      if (sub === "--help" || sub === "-h") {
        process.stdout.write(CONFIG_GROUP_HELP);
        process.exit(0);
      } else if (sub === "validate") {
        await cmdConfigValidate();
      } else {
        process.stderr.write(`[fail] Unknown subcommand: config ${sub ?? ""}
Run: violations config --help
`);
        process.exit(1);
      }
    } else if (command === "cache") {
      const sub = rest[0];
      if (sub === "--help" || sub === "-h") {
        process.stdout.write(CACHE_GROUP_HELP);
        process.exit(0);
      } else if (sub === "clear") {
        await cmdCacheClear();
      } else {
        process.stderr.write(`[fail] Unknown subcommand: cache ${sub ?? ""}
Run: violations cache --help
`);
        process.exit(1);
      }
    } else if (command === "logs") {
      warnUnknownArgs(rest, ["--follow", "-f"], "violations logs");
      await cliLogsCommand(ConfigDir.get("violations"), { follow: rest.includes("--follow") || rest.includes("-f") });
    } else if (command === "cli") {
      const sub = rest[0];
      if (sub === "--help" || sub === "-h") {
        process.stdout.write(CLI_GROUP_HELP);
        process.exit(0);
      } else if (sub === "version") {
        warnUnknownArgs(rest.slice(1), [], "violations cli version");
        const channel = readChannelFromConfig(ConfigDir.get("violations"));
        await cliVersionCommand("@wadeck-app/violations-cli", VERSION, channel);
      } else if (sub === "self-check") {
        warnUnknownArgs(rest.slice(1), [], "violations cli self-check");
        cmdCliSelfCheck();
      } else if (sub === "update") {
        const updaterPath = (0, import_node_path9.join)((0, import_node_path9.dirname)(bundlePath), "violations-updater.cjs");
        if (!(0, import_node_fs10.existsSync)(updaterPath)) {
          process.stderr.write("[fail] updater not found (dev mode?)\n");
          process.exit(1);
        }
        await cliUpdateCommand(updaterPath, "@wadeck-app/violations-cli", { rawArgs: rest.slice(1) });
      } else if (sub === "logs") {
        const subArgs = rest.slice(1);
        warnUnknownArgs(subArgs, ["--follow", "-f"], "violations cli logs");
        await cliLogsCommand(ConfigDir.get("violations"), { follow: subArgs.includes("--follow") || subArgs.includes("-f") });
      } else {
        process.stderr.write(`[fail] Unknown subcommand: cli ${sub ?? ""}
Run: violations cli --help
`);
        process.exit(1);
      }
    } else {
      process.stderr.write(`[fail] Unknown command: ${command}
Run: violations --help
`);
      process.exit(1);
    }
  } finally {
    if (!userConfig.update.disabled) {
      updater.scheduleBackgroundUpdate(bundlePath, "violations-updater.cjs");
    }
  }
}
var isEntryPoint = process.argv[1] !== void 0 && (process.argv[1] === (0, import_node_url3.fileURLToPath)(__importMetaUrl) || process.argv[1].endsWith("cli.js") || process.argv[1].endsWith("violations") || process.argv[1].endsWith("violations.cjs"));
if (isEntryPoint) {
  main().catch((err) => {
    process.stderr.write(`violations: ${String(err)}
`);
    process.exit(1);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runViolationsCommand
});
/*! Bundled license information:

is-number/index.js:
  (*!
   * is-number <https://github.com/jonschlinkert/is-number>
   *
   * Copyright (c) 2014-present, Jon Schlinkert.
   * Released under the MIT License.
   *)

to-regex-range/index.js:
  (*!
   * to-regex-range <https://github.com/micromatch/to-regex-range>
   *
   * Copyright (c) 2015-present, Jon Schlinkert.
   * Released under the MIT License.
   *)

fill-range/index.js:
  (*!
   * fill-range <https://github.com/jonschlinkert/fill-range>
   *
   * Copyright (c) 2014-present, Jon Schlinkert.
   * Licensed under the MIT License.
   *)
*/
