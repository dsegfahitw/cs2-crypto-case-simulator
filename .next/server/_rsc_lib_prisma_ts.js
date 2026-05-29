"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_rsc_lib_prisma_ts";
exports.ids = ["_rsc_lib_prisma_ts"];
exports.modules = {

/***/ "(rsc)/./lib/prisma.ts":
/*!***********************!*\
  !*** ./lib/prisma.ts ***!
  \***********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getPrisma: () => (/* binding */ getPrisma)\n/* harmony export */ });\n/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pg */ \"pg\");\n/* harmony import */ var _prisma_adapter_pg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @prisma/adapter-pg */ \"@prisma/adapter-pg\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_2__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([pg__WEBPACK_IMPORTED_MODULE_0__, _prisma_adapter_pg__WEBPACK_IMPORTED_MODULE_1__]);\n([pg__WEBPACK_IMPORTED_MODULE_0__, _prisma_adapter_pg__WEBPACK_IMPORTED_MODULE_1__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\nconst globalForPrisma = globalThis;\nfunction getPrisma() {\n    if (globalForPrisma.prisma) return globalForPrisma.prisma;\n    const pool = new pg__WEBPACK_IMPORTED_MODULE_0__.Pool({\n        connectionString: process.env.DATABASE_URL\n    });\n    const adapter = new _prisma_adapter_pg__WEBPACK_IMPORTED_MODULE_1__.PrismaPg(pool);\n    const prisma = new _prisma_client__WEBPACK_IMPORTED_MODULE_2__.PrismaClient({\n        adapter\n    });\n    if (true) {\n        globalForPrisma.prisma = prisma;\n    }\n    return prisma;\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvcHJpc21hLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQTBCO0FBQ29CO0FBQ0E7QUFFOUMsTUFBTUcsa0JBQWtCQztBQUVqQixTQUFTQztJQUNkLElBQUlGLGdCQUFnQkcsTUFBTSxFQUFFLE9BQU9ILGdCQUFnQkcsTUFBTTtJQUV6RCxNQUFNQyxPQUFPLElBQUlQLG9DQUFJQSxDQUFDO1FBQUVRLGtCQUFrQkMsUUFBUUMsR0FBRyxDQUFDQyxZQUFZO0lBQUM7SUFDbkUsTUFBTUMsVUFBVSxJQUFJWCx3REFBUUEsQ0FBQ007SUFDN0IsTUFBTUQsU0FBUyxJQUFJSix3REFBWUEsQ0FBQztRQUFFVTtJQUFRO0lBRTFDLElBQUlILElBQXFDLEVBQUU7UUFDekNOLGdCQUFnQkcsTUFBTSxHQUFHQTtJQUMzQjtJQUVBLE9BQU9BO0FBQ1QiLCJzb3VyY2VzIjpbIi9ob21lL3J1bm5lci93b3Jrc3BhY2UvbGliL3ByaXNtYS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQb29sIH0gZnJvbSAncGcnO1xuaW1wb3J0IHsgUHJpc21hUGcgfSBmcm9tICdAcHJpc21hL2FkYXB0ZXItcGcnO1xuaW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xuXG5jb25zdCBnbG9iYWxGb3JQcmlzbWEgPSBnbG9iYWxUaGlzIGFzIHVua25vd24gYXMgeyBwcmlzbWE6IFByaXNtYUNsaWVudCB9O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJpc21hKCk6IFByaXNtYUNsaWVudCB7XG4gIGlmIChnbG9iYWxGb3JQcmlzbWEucHJpc21hKSByZXR1cm4gZ2xvYmFsRm9yUHJpc21hLnByaXNtYTtcblxuICBjb25zdCBwb29sID0gbmV3IFBvb2woeyBjb25uZWN0aW9uU3RyaW5nOiBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkwgfSk7XG4gIGNvbnN0IGFkYXB0ZXIgPSBuZXcgUHJpc21hUGcocG9vbCk7XG4gIGNvbnN0IHByaXNtYSA9IG5ldyBQcmlzbWFDbGllbnQoeyBhZGFwdGVyIH0gYXMgQ29uc3RydWN0b3JQYXJhbWV0ZXJzPHR5cGVvZiBQcmlzbWFDbGllbnQ+WzBdKTtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPSBwcmlzbWE7XG4gIH1cblxuICByZXR1cm4gcHJpc21hO1xufVxuIl0sIm5hbWVzIjpbIlBvb2wiLCJQcmlzbWFQZyIsIlByaXNtYUNsaWVudCIsImdsb2JhbEZvclByaXNtYSIsImdsb2JhbFRoaXMiLCJnZXRQcmlzbWEiLCJwcmlzbWEiLCJwb29sIiwiY29ubmVjdGlvblN0cmluZyIsInByb2Nlc3MiLCJlbnYiLCJEQVRBQkFTRV9VUkwiLCJhZGFwdGVyIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/prisma.ts\n");

/***/ })

};
;