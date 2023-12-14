import { action } from "@ember/object";
import Component from "@ember/component";
import { bufferedProperty } from "discourse/mixins/buffered-content";

export default Component.extend(bufferedProperty("model"), {
  @action
  selectThumbnail(image_url, image_upload_id) {
    this.set("model.buffered.user_chosen_thumbnail_url", image_url);
    this.set("model.buffered.image_upload_id", image_upload_id);
    this.closeModal();
  }
});
