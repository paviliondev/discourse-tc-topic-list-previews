import { ajax } from 'discourse/lib/ajax';
import { popupAjaxError } from 'discourse/lib/ajax-error';
import { action, computed } from "@ember/object";
import { inject as service } from "@ember/service";
import Component from '@glimmer/component';
import TlpThumbnailSelectorModalComponent from "../components/modal/tlp-thumbnail-selector";

export default class SelectThumbnailComponent extends Component {
  @service modal;

  @action
  showThumbnailSelector() {
    ajax(`/topic-previews/thumbnail-selection.json?topic=${this.args.topic_id}`).then(result => {
      this.modal.show(TlpThumbnailSelectorModalComponent, {
        model: {
          thumbnails: result.thumbnailselection,
          topic_id: this.args.topic_id,
          topic_title: this.args.topic_title,
          buffered: this.args.buffered
        }
      })
    }).catch((error) => {
      popupAjaxError(error);
    });
  }
}
