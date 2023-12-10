import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import Component from '@glimmer/component';

export default class TlpThumbnailSelectorModalComponent extends Component {
  @tracked flash = this.args.model?.flash;

  @action
  selectThumbnail(image_url, image_upload_id) {
    this.args.model.buffered.user_chosen_thumbnail_url = image_url;
    this.args.model.buffered.image_upload_id = image_upload_id;
    this.args.closeModal();
  }
};
