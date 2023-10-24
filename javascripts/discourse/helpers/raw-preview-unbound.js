import { registerRawHelper } from 'discourse-common/lib/helpers';
import { renderUnboundPreview } from '../lib/tlp-utilities';
import Handlebars from "handlebars";

registerRawHelper("raw-preview-unbound", rawPreviewUnbound);

export default function rawPreviewUnbound(thumbnails, params) {
  return new Handlebars.SafeString(renderUnboundPreview(thumbnails, params));
};
