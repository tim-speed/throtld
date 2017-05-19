

// SOURCE: http://stackoverflow.com/a/13653180
const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


const validate = module.exports = {
  isUUID(str) {
    if (!validate.isString(str)) {
      return false;
    }
    return REGEX_UUID.test(str);
  },
  isString(val) {
    return typeof val === 'string';
  },
  isObject(val) {
    return typeof val === 'object' && val !== null;
  },
  isNumber(val) {
    return !isNaN(Number(val));
  }
};
