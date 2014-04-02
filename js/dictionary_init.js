window.dictionary = {};
var dsplit = dictionaryString.split(",");
for (var i = 0; i < dsplit.length; i++) {
  window.dictionary[dsplit[i]] = true;
}
