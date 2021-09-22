import Component from "@ember/component";
import discourseComputed, {
  on,
  observes,
} from "discourse-common/utils/decorators";

export default Component.extend({
  tagName: "",
  thumbnailSrc: "",

  init() {
    this._super(...arguments);
    this.thumbnailSrc = this.previewUrl(this.get("thumbnails"), this.get("params.opts.featured"));
  },

  previewUrl(thumbnails, featured = false) {
    const preferLowRes =
      Discourse.User._current === null
        ? false
        : Discourse.User._current.custom_fields
            .tlp_user_prefs_prefer_low_res_thumbnails;
    if (thumbnails) {
      let resLevel = featured
        ? settings.topic_list_featured_images_resolution_level
        : settings.topic_list_thumbnail_resolution_level;
      resLevel = Math.round(((thumbnails.length - 1) / 6) * resLevel);
      if (preferLowRes) {
        resLevel++;
      }
      if (window.devicePixelRatio && resLevel > 0) {
        resLevel--;
      }
      return resLevel <= thumbnails.length - 1
        ? thumbnails[resLevel].url
        : thumbnails[thumbnails.length - 1].url;
    } else {
      return false;
    }
  }
})
