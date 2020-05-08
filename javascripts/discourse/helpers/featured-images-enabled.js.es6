import { featuredImagesEnabled } from '../lib/tlp-utilities';

export default Ember.Helper.helper(function(params) {
  return featuredImagesEnabled(params[0], params[1]);
});
