var GRAY_ICON = 'https://cdn.hyperdev.com/us-east-1%3A3d31b21c-02d0-492d-ad3f-bf1174e4fe07%2Ficon-gray.svg';
var WHITE_ICON = 'https://cdn.hyperdev.com/us-east-1%3A3d31b21c-02d0-492d-ad3f-bf1174e4fe07%2Ficon-white.svg';

var getChecklistProgress = function(t) {
  return t.card('checklists').then(function(card) {
    var total = 0, done = 0;
    (card.checklists || []).forEach(function(cl) {
      (cl.checkItems || []).forEach(function(item) {
        total++;
        if (item.state === 'complete') done++;
      });
    });
    if (total === 0) return null;
    var pct = Math.round((done / total) * 100);
    var color = 'red';
    if (pct >= 100) color = 'green';
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
      if (!progress) return [];
      return [{
        text: progress.text,
        color: progress.color,
        icon: progress.color === 'white' ? WHITE_ICON : GRAY_ICON
      }];
    });
  },
  'card-detail-badges': function(t, options) {
    return getChecklistProgress(t).then(function(progress) {
      if (!progress) return [];
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
        url: t.signUrl('./card-back.html'),
        height: 200
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
          url: './card-fields.html',
          height: 400
        });
      }
    }];
  },
  'board-buttons': function(t, options) {
    return [{
      icon: WHITE_ICON,
      text: 'Gestionar Campos',
      callback: function(t) {
        return t.popup({
          title: 'Configuración de Campos',
          url: './settings.html',
          height: 600
        });
      }
    }];
  },
  'show-settings': function(t, options) {
    return t.popup({
      title: 'Configuración del Power-Up',
      url: './settings.html',
      height: 600
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
