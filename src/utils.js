import assignWith from 'lodash/assignWith';
import forEach from 'lodash/forEach';
import isNaN from 'lodash/isNaN';
import isPlainObject from 'lodash/isPlainObject';
import keys from 'lodash/keys';
import set from 'lodash/set';
import some from 'lodash/some';

const setWithWarning = (objValue, newValue, key, object) => {
  // istanbul ignore next
  if (process.env.NODE_ENV === 'development' && object[key] && newValue !== objValue) {
    console.warn(`espn-fantasy-football-api: Assigning non-empty key ${key}. Set value: ${objValue}, new value: ${newValue}!`);
  }

  return newValue;
};

const flattenObject = (object) => {
  const flatObject = {};

  forEach(object, (value, key) => {
    if (isPlainObject(value)) {
      assignWith(flatObject, flattenObject(value), setWithWarning);
    } else {
      // istanbul ignore next
      if (process.env.NODE_ENV === 'development' && flatObject[key] && value !== flatObject[key]) {
        console.warn(`espn-fantasy-football-api: Assigning non-empty key ${key}. Set value: ${flatObject[key]}, new value: ${value}!`);
      }

      set(flatObject, key, value);
    }
  });

  return flatObject;
};

const flattenObjectSansNumericKeys = (object) => {
  const flatObject = {};

  forEach(object, (value, key) => {
    if (isPlainObject(value) && !some(keys(value), (k) => !isNaN(Number(k)))) {
      assignWith(flatObject, flattenObjectSansNumericKeys(value), setWithWarning);
    } else {
      // istanbul ignore next
      if (process.env.NODE_ENV === 'development' && flatObject[key] && value !== flatObject[key]) {
        console.warn(`espn-fantasy-football-api: Assigning non-empty key ${key}. Set value: ${flatObject[key]}, new value: ${value}!`);
      }

      set(flatObject, key, value);
    }
  });

  return flatObject;
};

export {
  flattenObject,
  flattenObjectSansNumericKeys
};
