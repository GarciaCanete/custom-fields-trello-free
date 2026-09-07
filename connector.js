var BASE_URL = 'https://garciacanete.github.io/custom-fields-trello-free/';
var POWERUP_VERSION = 'v8';
var GRAY_ICON = BASE_URL + 'icon.svg';
var WHITE_ICON = BASE_URL + 'icon.svg';

var getChecklistProgress = function(t) {
  return t.card('checklists').then(function(card) {
    var total = 0;
    var done = 0;

    (card.checklists || []).forEach(function(cl) {
      (cl.checkItems || []).forEach(function(item) {
        total++;
        if (item.state === 'complete') {
          done++;
        }
      });
    });

    var pct = total > 0 ? Math.round((done / total) * 100) : 0;
    var color = 'red';

    if (pct >= 100 && total > 0) color = 'green';
    else if (pct >= 50) color = 'yellow';

    return {
      text: done + '/' + total + ' (' + pct + '%)',
      color: color
    };
  });
};

TrelloPowerUp.initialize({
  'card-badges': function(t, options) {
    return getChecklistProgress(t).then(function(progress) {
      return [{
        text: progress.text,
        color: progress.color,
        icon: GRAY_ICON
      }];
    });
  },
  'card-detail-badges': function(t, options) {
    return getChecklistProgress(t).then(function(progress) {
      return [{
        title: 'Progreso Checklists',
        text: progress.text,
        color: progress.color
      }];
    });
  },
  'card-back-section': function(t, options) {
    return {
      title: 'Campos Personalizados y Progreso',
      icon: GRAY_ICON,
      content: {
        type: 'iframe',
        url: t.signUrl(BASE_URL + 'card-back.html?' + POWERUP_VERSION),
        height: 420
      }
    };
  },
  'card-buttons': function(t, options) {
    return [{
      icon: GRAY_ICON,
      text: 'Campos',
      callback: function(t) {
        return t.popup({
          title: 'Editar Campos',
          url: t.signUrl(BASE_URL + 'card-fields.html?' + POWERUP_VERSION),
          height: 500
        });
      }
    }];
  },
  'board-buttons': function(t, options) {
    return [
      {
        icon: WHITE_ICON,
        text: 'Gestionar Campos',
        callback: function(t) {
          return t.popup({
            title: 'Configuración de Campos',
            url: t.signUrl(BASE_URL + 'settings.html?' + POWERUP_VERSION),
            height: 650
          });
        }
      },
      {
        icon: WHITE_ICON,
        text: 'Filtrar Campos',
        callback: function(t) {
          return t.popup({
            title: 'Filtrar por Campos',
            url: t.signUrl(BASE_URL + 'filters.html?' + POWERUP_VERSION),
            height: 650
          });
        }
      }
    ];
  },
  'show-settings': function(t, options) {
    return t.popup({
      title: 'Configuración del Power-Up',
      url: t.signUrl(BASE_URL + 'settings.html?' + POWERUP_VERSION),
      height: 650
    });
  },
  'card-move-restrictions': function(t, options) {
    return Promise.all([
      t.get('board', 'shared', 'fieldDefs'),
      t.get('card', 'shared', 'fieldValues')
    ]).then(function(data) {
      var defs = data[0] || [];
      var values = data[1] || {};
      var missing = defs.filter(function(f) {
        if (!f.required) return false;
        if (f.type === 'checkbox') return false; 
        var v = values[f.id];
        return v === undefined || v === null || String(v).trim() === '';
      });
      return missing.map(function(f) {
        return { text: '⚠️ Campo requerido vacío: ' + f.name };
      });
    });
  }
});
