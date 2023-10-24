import { renderUnboundPreview } from '../lib/tlp-utilities';
import Handlebars from "handlebars";

export default function previewUnbound(thumbnails, params) {
  return new Handlebars.SafeString(renderUnboundPreview(thumbnails, params));
};
