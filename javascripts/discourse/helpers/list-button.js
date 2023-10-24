import { registerRawHelper } from 'discourse-common/lib/helpers';
import { buttonHTML } from '../lib/tlp-utilities';
import Handlebars from "handlebars";

registerRawHelper("list-button", listButton);

export default function listButton(button, params) {
  return new Handlebars.SafeString(buttonHTML(button, params));
};
