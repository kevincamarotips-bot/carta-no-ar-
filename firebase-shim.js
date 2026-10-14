/*
  Ponte entre o jogo e o Firebase Realtime Database.
  O jogo foi escrito para os recursos do Claude (db, user, room).
  Este arquivo oferece as mesmas funções usando o Firebase, para o jogo
  rodar em qualquer site (GitHub Pages) sem conta Claude.
  Se firebase-config.js estiver vazio, os modos com amigos ficam desligados
  e o modo Sozinho continua funcionando.
*/
(function () {
  if (window.claude && typeof window.claude.use === 'function') return; // dentro do Claude: usa o original

  var cfg = window.FIREBASE_CONFIG;
  var ready = !!(cfg && cfg.databaseURL && window.firebase);
  var rtdb = null;
  if (ready) {
    try { firebase.initializeApp(cfg); rtdb = firebase.database(); }
    catch (e) { console.warn('Firebase não iniciou:', e); ready = false; }
  }

  // id fixo por aparelho, guardado no navegador
  function deviceId() {
    var id = null;
    try { id = localStorage.getItem('cartaNoAr.uid'); } catch (e) {}
    if (!id) {
      id = 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      try { localStorage.setItem('cartaNoAr.uid', id); } catch (e) {}
    }
    return id;
  }
  var UID = deviceId();

  /* ---------- user ---------- */
  var user = {
    id: function () { return Promise.resolve(UID); },
    me: function () { return Promise.resolve({ id: UID }); },
    isOwner: function () { return false; },
    canEdit: function () { return false; },
    can: function () { return true; }
  };

  /* ---------- db (só o que o jogo usa) ---------- */
  function snapDoc(id, val) {
    var exists = val !== null && val !== undefined;
    return { id: id, exists: exists, data: function () { return exists ? val : undefined; }, metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function docRef(path) {
    var ref = rtdb.ref(path), id = path.split('/').pop();
    return {
      id: id, path: path,
      get: function () { return ref.get().then(function (s) { return snapDoc(id, s.val()); }); },
      set: function (data) { return ref.set(data); },
      update: function (data) { return ref.update(data); },
      delete: function () { return ref.remove(); },
      onSnapshot: function (next, err) {
        var h = function (s) { next(snapDoc(id, s.val())); };
        ref.on('value', h, function (e) { err && err({ code: 'unavailable', message: String(e) }); });
        return function () { ref.off('value', h); };
      }
    };
  }
  function query(path, order, dir, lim) {
    return {
      orderBy: function (f, d) { return query(path, f, d || 'asc', lim); },
      limit: function (n) { return query(path, order, dir, n); },
      onSnapshot: function (next, err) {
        var q = rtdb.ref(path);
        if (order) q = q.orderByChild(order);
        if (lim) q = dir === 'desc' ? q.limitToLast(lim) : q.limitToFirst(lim);
        var h = function (s) {
          var docs = [];
          s.forEach(function (c) { docs.push(snapDoc(c.key, c.val())); });
          if (order && dir === 'desc') docs.reverse();
          next({ docs: docs, size: docs.length, empty: !docs.length, docChanges: function () { return []; }, metadata: { fromCache: false, hasPendingWrites: false } });
        };
        q.on('value', h, function (e) { err && err({ code: 'unavailable', message: String(e) }); });
        return function () { q.off('value', h); };
      },
      doc: function (id) { return docRef(path + '/' + id); }
    };
  }
  var db = {
    doc: docRef,
    collection: function (path) { return query(path, null, 'asc', 0); }
  };

  /* ---------- room (presença por mesa) ---------- */
  var PEER = Math.random().toString(36).slice(2, 12);
  function makeRoom(name) {
    var base = rtdb.ref('rooms/' + name + '/peers');
    var mine = base.child(PEER);
    var me = {}, list = Object.freeze([]), peerHandlers = [], connHandlers = [], connected = false, left = false;
    var sendTimer = null;

    function emitPeers() {
      var change = { peers: list, joined: [], left: [], updated: list };
      peerHandlers.forEach(function (h) { try { h(change); } catch (e) { console.error(e); } });
    }
    function flush() {
      sendTimer = null;
      if (left) return;
      mine.set({ by: UID, presence: me, updatedAt: firebase.database.ServerValue.TIMESTAMP });
    }
    var onVal = function (s) {
      var arr = [];
      s.forEach(function (c) {
        var v = c.val() || {};
        arr.push(Object.freeze({
          peer: c.key, by: v.by || null, isMe: c.key === PEER, sameTab: c.key === PEER,
          kind: 'viewer', guest: false,
          presence: Object.freeze(c.key === PEER ? Object.assign({}, me) : (v.presence || {})),
          updatedAt: Date.now()
        }));
      });
      list = Object.freeze(arr);
      emitPeers();
    };
    base.on('value', onVal);
    var connRef = rtdb.ref('.info/connected');
    var onConn = function (s) {
      connected = !!s.val();
      if (connected && !left) { mine.onDisconnect().remove(); flush(); }
      connHandlers.forEach(function (h) { try { h(connected); } catch (e) {} });
    };
    connRef.on('value', onConn);

    return {
      name: name,
      presence: function (patch) {
        Object.keys(patch || {}).forEach(function (k) {
          if (patch[k] === null) delete me[k]; else me[k] = patch[k];
        });
        if (!sendTimer) sendTimer = setTimeout(flush, 120);
        return Promise.resolve();
      },
      peers: function () { return list; },
      onPeers: function (h) { peerHandlers.push(h); setTimeout(function () { h({ peers: list, joined: list, left: [], updated: [] }); }, 0); return function () { peerHandlers = peerHandlers.filter(function (x) { return x !== h; }); }; },
      connected: function () { return connected; },
      onConnection: function (h) { connHandlers.push(h); setTimeout(function () { h(connected); }, 0); return function () { connHandlers = connHandlers.filter(function (x) { return x !== h; }); }; },
      emit: function () { return Promise.resolve(); },
      on: function () { return function () {}; },
      leave: function () {
        left = true; base.off('value', onVal); connRef.off('value', onConn);
        mine.onDisconnect().cancel(); return mine.remove();
      }
    };
  }
  var room = {
    join: function (name) { return Promise.resolve(makeRoom(name)); }
  };

  window.CARTA_OFFLINE_MSG = 'Os modos com amigos ainda não foram ligados neste site. Siga o passo a passo do README para configurar o Firebase.';
  window.claude = {
    use: function (name) {
      if (!ready) return Promise.resolve(null);
      if (name === 'db') return Promise.resolve(db);
      if (name === 'user') return Promise.resolve(user);
      if (name === 'room') return Promise.resolve(room);
      return Promise.resolve(null);
    }
  };
})();
