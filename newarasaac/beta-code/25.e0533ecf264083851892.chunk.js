webpackJsonp([25],{"./app/containers/MaterialView/sagas.js":function(e,t,a){"use strict";function r(e){var t,r;return regeneratorRuntime.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:return n.prev=0,t=e.payload.idMaterial,n.next=4,a.i(s.put)(a.i(u.showLoading)());case 4:return n.next=6,a.i(s.call)(c.a.fetchMaterial,t);case 6:return r=n.sent,n.next=9,a.i(s.put)(o.a.success(r));case 9:return n.next=11,a.i(s.put)(a.i(u.hideLoading)());case 11:n.next=19;break;case 13:return n.prev=13,n.t0=n.catch(0),n.next=17,a.i(s.put)(a.i(u.hideLoading)());case 17:return n.next=19,a.i(s.put)(o.a.failure(n.t0.message));case 19:return n.prev=19,n.finish(19);case 21:case"end":return n.stop()}},d[0],this,[[0,13,19,21]])}function n(){var e;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,a.i(s.takeLatest)(o.b.REQUEST,r);case 2:return e=t.sent,t.next=5,a.i(s.take)(i.LOCATION_CHANGE);case 5:return t.next=7,a.i(s.cancel)(e);case 7:case"end":return t.stop()}},d[1],this)}Object.defineProperty(t,"__esModule",{value:!0});var s=a("./node_modules/redux-saga/effects.js"),i=(a.n(s),a("./node_modules/react-router-redux/lib/index.js")),u=(a.n(i),a("./node_modules/react-redux-loading-bar/build/index.js")),c=(a.n(u),a("./app/services/index.js")),o=a("./app/containers/MaterialView/actions.js");t.materialData=n;var d=[r,n].map(regeneratorRuntime.mark);t.default=[n]}});