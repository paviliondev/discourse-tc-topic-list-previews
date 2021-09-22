import loadScript from "discourse/lib/load-script";
import Component from "@ember/component";
import { htmlSafe } from "@ember/template";

export default Component.extend({
  tagName: "div",
  className: "thumbnail-image",
  imageStyle: "width:0%",
  background: [],

  colourCalc(emberObject) {
    let _this = emberObject;
    let results = new Ember.RSVP.Promise(function (resolve) {
      loadScript(settings.theme_uploads.colorThief).then(() => {
        let colorthief = new ColorThief();
        let background = [];
        let thisThumbnail = _this.element.querySelector("img");

        if (
          thisThumbnail.naturalWidth != "undefined" &&
          thisThumbnail.naturalWidth == 0
        ) {
          resolve({
            background: null,
          });
        } else {
          background = colorthief.getColor(thisThumbnail);
          resolve({
            background: background,
          });
        }
      });
    });
    results.then((results) => {
      if (results.background) {
        _this.attrs.onChangeColor(results.background);
      }
    });
  },

  styleCalc(emberObject) {
    let _this = emberObject;
    const opts = this.get("opts") || {};
    const category = this.get("category");

    let mobileView = Discourse.Site.currentProp("mobileView");

    const attrWidthSuffix = opts.tilesStyle ? "%" : "px";
    const attrHeightSuffix = opts.tilesStyle ? "" : "px";

    const category_width = category
      ? category.topic_list_thumbnail_width
      : false;

    const category_height = category
      ? category.topic_list_thumbnail_height
      : false;

    const featured_width = opts.featured
      ? settings.topic_list_featured_width
        ? settings.topic_list_featured_width
        : "auto"
      : false;

    const featured_height = opts.featured
      ? settings.topic_list_featured_height
      : false;

    const tiles_width = opts.tilesStyle ? "100" : false;
    const tiles_height = opts.tilesStyle ? "auto" : false;
    const custom_width = opts.thumbnailWidth ? opts.thumbnailWidth : false;
    const custom_height = opts.thumbnailHeight ? opts.thumbnailHeight : false;

    const height =
      custom_height ||
      tiles_height ||
      featured_height ||
      mobileView ? false : category_height ||
      mobileView ? settings.topic_list_thumbnail_height_mobile : settings.topic_list_thumbnail_height;

    const width =
      custom_width ||
      tiles_width ||
      featured_width ||
      (mobileView ? false : category_width) ||
      (mobileView ? settings.topic_list_thumbnail_width_mobile : settings.topic_list_thumbnail_width);

    const height_style = height ? `height:${height}${attrHeightSuffix};` : ``;
    const style = `${height_style}width:${width}${attrWidthSuffix}`;

    _this.set("imageStyle", htmlSafe(style));
  },

  didInsertElement() {
    this._super(...arguments);

    let thisElement = this.element.querySelector("img");

    let colourCalc = (() => {
      this.colourCalc(this);
    }).bind(this);

    let styleCalc = (() => {
      this.styleCalc(this);
    }).bind(this);

    thisElement.addEventListener("load", styleCalc);
    thisElement.addEventListener("load", colourCalc);
  },
});
