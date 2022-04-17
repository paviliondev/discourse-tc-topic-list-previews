import { iconHTML } from "discourse-common/lib/icon-library";

var isThumbnail = function (path) {
  return (
    typeof path === "string" &&
    path !== "false" &&
    path !== "nil" &&
    path !== "null" &&
    path !== ""
  );
};

var previewUrl = function (thumbnails, currentUser, featured = false) {
  const preferLowRes =
    (currentUser !== undefined && currentUser !== null) ?
      currentUser.custom_fields
        .tlp_user_prefs_prefer_low_res_thumbnails
      : false;
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
};

var renderUnboundPreview = function (thumbnails, params) {
  const url = previewUrl(thumbnails, params.currentUser, params.opts.featured) || getDefaultThumbnail();

  if (!url) return "";

  const opts = params.opts || {};

  if (
    !opts.tilesStyle &&
    !opts.featured &&
    params.site.mobileView
  ) {
    return `<img class="thumbnail" src="${url}" loading="lazy"/>`;
  }

  const attrWidthSuffix = opts.tilesStyle ? "%" : "px";
  const attrHeightSuffix = opts.tilesStyle ? "" : "px";
  const css_classes = opts.tilesStyle
    ? "thumbnail tiles-thumbnail"
    : "thumbnail";

  const category_width = params.category
    ? params.category.topic_list_thumbnail_width
    : false;

  const category_height = params.category
    ? params.category.topic_list_thumbnail_height
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
    category_height ||
    settings.topic_list_thumbnail_height;

  const width =
    custom_width ||
    tiles_width ||
    featured_width ||
    category_width ||
    settings.topic_list_thumbnail_width;

  const height_style = height ? `height:${height}${attrHeightSuffix};` : ``;
  const style = `${height_style}width:${width}${attrWidthSuffix}`;

  return `<img class="${css_classes}" src="${url}" style="${style}" loading="lazy"/>`;
};

var testImageUrl = function (thumbnails, currentUser, callback) {
  const url = previewUrl(thumbnails, currentUser);
  let timeout = settings.topic_list_test_image_url_timeout;
  let timer,
    img = new Image();
  img.onerror = img.onabort = function () {
    clearTimeout(timer);
    callback(false);
  };
  img.onload = function () {
    clearTimeout(timer);
    callback(true);
  };
  timer = setTimeout(function () {
    callback(false);
  }, timeout);
  img.src = url;
};

let getDefaultThumbnail = () => {
  let defaultThumbnail = settings.topic_list_default_thumbnail;
  return defaultThumbnail ? defaultThumbnail : false;
};

var buttonHTML = function (action, topic) {
  action = action || {};

  var html = "<button class='list-button " + action.class + "'";
  if (action.title) {
    html += 'title="' + I18n.t(action.title) + '"';
  }
  if (action.topic_id) {
    html += ` data-topic_id=${action.topic_id}`;
  }
  if (action.topic_post_id) {
    html += ` data-topic_post_id=${action.topic_post_id}`;
  }
  if (action.disabled) {
    html += " disabled=true";
  }
  if (action.type == "like" && action.like_count > 0) {
    html += `><span class="like-count">${action.like_count}</span>${iconHTML(
      action.icon
    )}`;
  } else if (action.type == "like" && action.like_count == 0) {
    html += `><span class="like-count"></span>${iconHTML(action.icon)}`;
  } else {
    html += `>${iconHTML(action.icon)}`;
  }
  html += "</button>";
  return html;
};

const featuredImagesEnabled = function (category = null, isTopic = false) {
  if (isTopic && !settings.topic_list_featured_images_topic) {
    return false;
  }
  if (!category || settings.topic_list_featured_images_category) {
    return settings.topic_list_featured_images;
  } else {
    return category.topic_list_featured_images;
  }
};

export {
  renderUnboundPreview,
  testImageUrl,
  buttonHTML,
  featuredImagesEnabled,
  getDefaultThumbnail,
};
