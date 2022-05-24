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

  enabledForCurrentTopicListRouteType(currentTopicListRoute, infoType) {
    let checkList = [];

    switch(infoType)
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

    if (currentTopicListRoute == 'userActivity.portfolio') currentTopicListRoute = 'activity-portfolio';
    if (currentTopicListRoute == 'userActivity.topics') currentTopicListRoute = 'activity-topics';
    if (currentTopicListRoute.indexOf("topic") > -1) currentTopicListRoute = 'suggested';

    let onMobile = Site.current().mobileView;

    let found_item = checkList.find(item => {
      
      let mobileSetting = false;
      let itemShortRouteName = item
    
      if (item.indexOf("-mobile") > -1) {
        mobileSetting = true
        itemShortRouteName = item.substring(0,item.indexOf("-mobile"))
      }

      if (settings.topic_list_set_category_defaults) {
        if (currentTopicListRoute.indexOf("Category") > -1) {
          currentTopicListRoute = item.substring(0,item.indexOf("Category"))
        } else {
          if (currentTopicListRoute == 'discovery.category') {
            currentTopicListRoute = 'discovery.latest'
          }
        }
      }

      if (currentTopicListRoute.indexOf(itemShortRouteName) > -1 && ((onMobile && mobileSetting) || (!onMobile && !mobileSetting))) {
        return true;
      }
      return false;
    })
    return (found_item && found_item.length > 0)
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
    "router.currentRoute.attributes.id", // For discourse instances earlier than https://github.com/discourse/discourse/commit/f7b5ff39cf
    "router.currentRoute.attributes.tag.id"
  )
  viewingTagId(currentRouteName, legacyTagId, tagId) {
    if (!currentRouteName.match(/^tags?\.show/)) {
      return;
    }
    return tagId || legacyTagId;
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
