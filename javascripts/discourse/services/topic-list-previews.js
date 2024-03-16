import Service, { inject as service } from "@ember/service";
import discourseComputed from "discourse-common/utils/decorators";
import Site from "discourse/models/site";
import { action, computed } from "@ember/object";
import { dependentKeyCompat } from "@ember/object/compat";

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

export default class TopicListPreviewsService extends Service {
  @service router;
  @service discovery;

  @dependentKeyCompat
  get isTopicListRoute() {
    return this.discovery.onDiscoveryRoute;
  }

  @computed("router.currentRouteName")
  get isTopicRoute() {
    return this.router.currentRouteName.match(/^topic\./);
  }

  @dependentKeyCompat
  get viewingCategoryId() {
    return this.discovery.category?.id;
  }

  @dependentKeyCompat
  get viewingTagId() {
    return this.discovery.tag?.id;
  }

  get wideFormat() {
    return settings.topic_list_tiles_wide_format;
  }

  enabledForCurrentTopicListRouteType(infoType) {
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

    let currentTopicListRoute = this.currentTopicListRoute;

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
          currentTopicListRoute = currentTopicListRoute.substring(0,currentTopicListRoute.indexOf("Category"))
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
  }

  @computed(
   "router.currentRouteName"
  )
  get currentTopicListRoute() {
    return this.router.currentRouteName
  }

  @computed(
    "viewingCategoryId",
    "viewingTagId",
    "router.currentRoute.metadata.customThumbnailMode",
    "currentTopicListRoute"
  )
  get displayMode() {
    let displayMode = [];

    if (thumbnailCategories.includes(this.viewingCategoryId) || thumbnailTags.includes(this.viewingTagId) || this.enabledForCurrentTopicListRouteType("thumbnails")) {
      displayMode.push("thumbnails");
    }
    if (tilesCategories.includes(this.viewingCategoryId) || tilesTags.includes(this.viewingTagId) || this.enabledForCurrentTopicListRouteType("tiles")) {
      displayMode.push("tiles");
    }
    if (excerptCategories.includes(this.viewingCategoryId) || excerptTags.includes(this.viewingTagId) || this.enabledForCurrentTopicListRouteType("excerpts")) {
      displayMode.push("excerpts");
    }
    if (actionCategories.includes(this.viewingCategoryId) || actionTags.includes(this.viewingTagId) || this.enabledForCurrentTopicListRouteType("actions")) {
      displayMode.push("actions");
    }

    return displayMode;
  }

  @computed("displayMode")
  get enabledForRoute() {
    return this.displayMode.length !== 0;
  }

  @computed("enabledForRoute", "displayMode")
  get displayThumbnails() {
    return this.enabledForRoute && this.displayMode.includes("thumbnails");
  }

  @computed("enabledForRoute", "displayMode")
  get displayTiles() {
    return this.enabledForRoute && this.displayMode.includes("tiles");
  }

  @computed("enabledForRoute", "displayMode")
  get displayExcerpts() {
    return this.enabledForRoute && this.displayMode.includes("excerpts");
  }

  @computed("enabledForRoute", "displayMode")
  get displayActions() {
    return this.enabledForRoute && this.displayMode.includes("actions");
  }
};
