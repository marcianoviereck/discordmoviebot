var immutableJS = require('immutable');
var logger = require('winston');

let _storage = immutableJS.Map();

exports.bulkSave = function(listWithValues, idProperty) {
  listWithValues.forEach(value => {
    _storage = _storage.set(value.get(idProperty), value);
  });
  return _storage;
}

exports.save = function(id, value) {
  _storage = _storage.set(id, value);
  return _storage;
}

exports.delete = function(id) {
  _storage = _storage.delete(id);
  return _storage;
}

exports.findById = function(id) {
  return _storage.get(id);
}

exports.findByProperty = function(property, value) {
  return _storage.toList().find(item => {
    const propertyValue = item.get(property);
    if(propertyValue && value && (propertyValue.toUpperCase || value.toUpperCase)) {
      if(propertyValue.toUpperCase() === value.toUpperCase()) {
        return item;
      }
    }
    if(propertyValue === value) {
      return item;
    }
  });
}

exports.getAll = function() {
  return _storage;
}
