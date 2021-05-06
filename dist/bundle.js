/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/main.js":
/*!************************!*\
  !*** ./src/js/main.js ***!
  \************************/
/***/ (() => {

eval("function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }\n\nfunction _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"next\", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"throw\", err); } _next(undefined); }); }; }\n\n// console.log(\"Main.js runs\");\n// Shorter document ready event...\n// $(function() {\n//     some JQuery methods go here'\n//     console.log(\"Hiding H2 tags via main.js\")\n//     $(\"h2\").hide()\n//     $(\"h3\").hide()\n// });\nfunction delay(n) {\n  n = n || 2000;\n  return new Promise(function (done) {\n    setTimeout(function () {\n      done();\n    }, n);\n  });\n}\n\nfunction pageTransition() {\n  var tl = gsap.timeline();\n  tl.to(\".loading-screen\", {\n    duration: 1.2,\n    width: \"100%\",\n    left: \"0%\",\n    ease: \"Expo.easeInOut\"\n  });\n  tl.to(\".loading-screen\", {\n    duration: 1,\n    width: \"100%\",\n    left: \"100%\",\n    ease: \"Expo.easeInOut\",\n    delay: 0.3\n  });\n  tl.set(\".loading-screen\", {\n    left: \"-100%\"\n  });\n}\n\nfunction contentAnimation() {\n  var tl = gsap.timeline();\n  tl.from(\".animate-this\", {\n    duration: 1,\n    y: 30,\n    opacity: 0,\n    stagger: 0.5,\n    delay: 0.2\n  }); // var t2 = gsap.timeline();\n  // t2.from(\".animate-credits\", { duration: 1, y: 30, opacity: 0, stagger: 1, delay: 0.2 });\n}\n\n$(function () {\n  barba.init({\n    sync: true,\n    transitions: [{\n      leave: function leave(data) {\n        var _this = this;\n\n        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {\n          var done;\n          return regeneratorRuntime.wrap(function _callee$(_context) {\n            while (1) {\n              switch (_context.prev = _context.next) {\n                case 0:\n                  done = _this.async();\n                  pageTransition();\n                  _context.next = 4;\n                  return delay(1000);\n\n                case 4:\n                  done();\n\n                case 5:\n                case \"end\":\n                  return _context.stop();\n              }\n            }\n          }, _callee);\n        }))();\n      },\n      enter: function enter(data) {\n        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {\n          return regeneratorRuntime.wrap(function _callee2$(_context2) {\n            while (1) {\n              switch (_context2.prev = _context2.next) {\n                case 0:\n                  contentAnimation();\n\n                case 1:\n                case \"end\":\n                  return _context2.stop();\n              }\n            }\n          }, _callee2);\n        }))();\n      },\n      once: function once(data) {\n        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {\n          return regeneratorRuntime.wrap(function _callee3$(_context3) {\n            while (1) {\n              switch (_context3.prev = _context3.next) {\n                case 0:\n                  contentAnimation();\n\n                case 1:\n                case \"end\":\n                  return _context3.stop();\n              }\n            }\n          }, _callee3);\n        }))();\n      }\n    }]\n  });\n});\n\n//# sourceURL=webpack://randycounsmanweb/./src/js/main.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/js/main.js"]();
/******/ 	
/******/ })()
;