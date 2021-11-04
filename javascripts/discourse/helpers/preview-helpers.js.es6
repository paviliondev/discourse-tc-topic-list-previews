import { registerUnbound } from 'discourse-common/lib/helpers';
import { renderUnboundPreview, buttonHTML } from '../lib/tlp-utilities';
import Handlebars from "handlebars";

registerUnbound('preview-unbound', function(thumbnails, params) {
  return new Handlebars.SafeString(renderUnboundPreview(thumbnails, params));
});

registerUnbound('list-button', function(button, params) {
  return new Handlebars.SafeString(buttonHTML(button, params));
});
