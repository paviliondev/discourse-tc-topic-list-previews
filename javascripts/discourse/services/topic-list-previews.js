import Service from "@ember/service";
import { inject as service } from "@ember/service";
import discourseComputed from "discourse-common/utils/decorators";
import Site from "discourse/models/site";

const thumbnailsTopicLists = settings.topic_list_thumbnails_topic_lists.split("|");
const tilesTopicLists = settings.topic_list_tiles_topic_lists.split("|");
const excerptsTopicLists = settings.topic_list_excerpts_topic_lists.split("|");
const actionsTopicLists = settings.topic_list_actions_topic_lists.split("|");
  
const thumbnailCategories = settings.topic_list_thumbnails_categories
  .split("|")
  .map((id) => parseInt(id, 10));

const tilesCategories = settings.topic_list_tiles_categories
  .split("|")
  .map((id) => parseInt(id, 10));

const excerptCategories = settings.topic_list_excerpts_categories
  .split("|")
  .map((id) => parseInt(id, 10));

const actionCategories = settings.topic_list_actions_categories
  .split("|")
  .map((id) => parseInt(id, 10));

const thumbnailTags = settings.topic_list_thumbnails_tags.split("|");
const excerptTags = settings.topic_list_excerpts_tags.split("|");
const tilesTags = settings.topic_list_tiles_tags.split("|");
const actionTags = settings.topic_list_actions_tags.split("|");

export default Service.extend({
  router: service("router"),

  enabledForCurrentTopicListRouteType(currentTopicListRoute, routeType) {
    let checkList = [];
    let found = false;

    switch(routeType)
    {
      case "thumbnails":
        checkList = thumbnailsTopicLists;
        break;
      case "tiles":
        checkList = tilesTopicLists;
        break;
      case "excerpts":
        checkList = excerptsTopicLists;
        break;
      case "actions":
        checkList = actionsTopicLists;
    }

    checkList.every((item) => {
      if (currentTopicListRoute.indexOf(item) > 0) {
        found = true;
        return false;
      }
    })
    return found
  },

  @discourseComputed(
   "router.currentRouteName"
  )
  currentTopicListRoute(currentRouteName) {
    return currentRouteName
  },

  @discourseComputed(
    "router.currentRouteName",
    "router.currentRoute.attributes.category.id"
  )
  viewingCategoryId(currentRouteName, categoryId) {
    if (!currentRouteName.match(/^discovery\./)) return;
    return categoryId;
  },

  @discourseComputed(
    "router.currentRouteName",
    "router.currentRoute.attributes.id"
  )
  viewingTagId(currentRouteName, tagId) {
    if (!currentRouteName.match(/^tags?\.show/)) return;
    return tagId;
  },

  @discourseComputed(
    "viewingCategoryId",
    "viewingTagId",
    "router.currentRoute.metadata.customThumbnailMode",
    "currentTopicListRoute"
  )
  displayMode(
    viewingCategoryId,
    viewingTagId,
    customThumbnailMode,
    currentTopicListRoute,
  ) {
    let displayMode = [];

    if (customThumbnailMode) displayMode.push(customThumbnailMode);
    if (thumbnailCategories.includes(viewingCategoryId) || thumbnailTags.includes(viewingTagId) || this.enabledForCurrentTopicListRouteType(currentTopicListRoute, "thumbnails")) {
      displayMode.push("thumbnails");
    }
    if (tilesCategories.includes(viewingCategoryId) || tilesTags.includes(viewingTagId) || this.enabledForCurrentTopicListRouteType(currentTopicListRoute,"tiles")) {
      displayMode.push("tiles");
    }
    if (excerptCategories.includes(viewingCategoryId) || excerptTags.includes(viewingTagId) || this.enabledForCurrentTopicListRouteType(currentTopicListRoute,"excerpts")) {
      displayMode.push("excerpts");
    }
    if (actionCategories.includes(viewingCategoryId) || actionTags.includes(viewingTagId) || this.enabledForCurrentTopicListRouteType(currentTopicListRoute,"actions")) {
      displayMode.push("actions");
    }
//    debugger;
    return displayMode;
  },

  @discourseComputed("displayMode")
  enabledForRoute(displayMode) {
    return displayMode !== [];
  },

  @discourseComputed("enabledForRoute", "displayMode")
  displayThumbnails(enabledForRoute, displayMode) {
    return enabledForRoute && displayMode.includes("thumbnails");
  },

  @discourseComputed("enabledForRoute", "displayMode")
  displayTiles(enabledForRoute, displayMode) {
    return enabledForRoute && displayMode.includes("tiles");
  },

  @discourseComputed("enabledForRoute", "displayMode")
  displayExcerpts(enabledForRoute, displayMode) {
    return enabledForRoute && displayMode.includes("excerpts");
  },

  @discourseComputed("enabledForRoute", "displayMode")
  displayActions(enabledForRoute, displayMode) {
    return enabledForRoute && displayMode.includes("actions");
  },
});