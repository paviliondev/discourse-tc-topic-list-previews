import discourseComputed, {
  on,
  observes,
} from "discourse-common/utils/decorators";
import { alias, and, bool, not } from "@ember/object/computed";
import { getDefaultThumbnail } from "../lib/tlp-utilities";
import { shareTopic, addLike, sendBookmark, removeLike } from "../lib/actions";
import { withPluginApi } from "discourse/lib/plugin-api";
import PostsCountColumn from "discourse/raw-views/list/posts-count-column";
import { resizeAllGridItems } from "../lib/gridupdate";
import loadScript from "discourse/lib/load-script";
import { cook } from "discourse/lib/text";
import { inject as service } from "@ember/service";
import { readOnly } from "@ember/object/computed";
import { computed } from "@ember/object";
import { htmlSafe } from "@ember/template";
import { debounce, scheduleOnce } from '@ember/runloop';

const PLUGIN_ID = "topic-list-previews-tc";

export default {
  name: "preview-edits",
  initialize(container) {
    withPluginApi("0.8.40", (api) => {
      api.onPageChange(() => {
        loadScript(
          "https://unpkg.com/imagesloaded@4/imagesloaded.pkgd.min.js"
        ).then(() => {
          if (document.querySelector(".tiles-style")) {
            imagesLoaded(
              document.querySelector(".tiles-style"),
              resizeAllGridItems()
            );
          }
        });
      });

      api.modifyClass("component:load-more", {
        pluginId: PLUGIN_ID,
        init() {
          this._super(...arguments);
          if (this.class == "paginated-topics-list") {
            this.set("eyelineSelector", ".topic-list-item");
          } else {
            this.set("eyelineSelector", this.selector);
          }
        },
      });

      api.modifyClass("component:basic-topic-list", {
        pluginId: PLUGIN_ID,
        topicListPreviewsService: service("topic-list-previews"),
        classNameBindings: [
          "hasThumbnails:showThumbnail",
          "hasTiles:tiles-style",
          "hasExcerpts:showExcerpt",
          "hasActions:showActions",
        ],
        hasThumbnails: readOnly("topicListPreviewsService.displayThumbnails"),
        hasTiles: readOnly("topicListPreviewsService.displayTiles"),
        hasExcerpts: readOnly("topicListPreviewsService.displayExcerpts"),
        hasActions: readOnly("topicListPreviewsService.displayActions"),
        currentRoute: alias("router.currentRouteName"),
        listChanged: false,

        skipHeader() {
          this.get("tilesStyle") || this.get("site.mobileView");
        },

        @discourseComputed("listChanged")
        tilesStyle() {
          this._settingEnabled("topic_list_tiles");
        },
      });

      api.modifyClass("component:discovery-topics-list", {
        pluginId: PLUGIN_ID,
        classNameBindings: [
          "hasMore:has-more",
        ],
        incomingCount: 0,

        @discourseComputed("incomingCount")
        hasMore (incomingCount) {
          return (incomingCount > 0);
        }
      });

      api.modifyClass("component:topic-list", {
        pluginId: PLUGIN_ID,
        topicListPreviewsService: service("topic-list-previews"),
        classNameBindings: [
          "hasThumbnails:showThumbnail",
          "hasTiles:tiles-style",
          "hasExcerpts:showExcerpt",
          "hasActions:showActions",
        ],
        hasThumbnails: readOnly("topicListPreviewsService.displayThumbnails"),
        hasTiles: readOnly("topicListPreviewsService.displayTiles"),
        hasExcerpts: readOnly("topicListPreviewsService.displayExcerpts"),
        hasActions: readOnly("topicListPreviewsService.displayActions"),

        listChanged: false,

        @on("init")
        setup() {
          const suggestedList = this.get("suggestedList");
          if (suggestedList) {
            const category = this.get(
              "parentView.parentView.parentView.topic.category"
            );
            this.set("category", category);
          }
        },

        @on("didRender")
        completeRender() {
          if (this.get("hasTiles")) {
            scheduleOnce("afterRender", this, this.applyTiles);
          }
        },

        @on("didInsertElement")
        @observes("currentRoute")
        setupListChanged() {
          this.toggleProperty("listChanged");
        },

        @discourseComputed("listChanged")
        thumbnailFirstXRows() {
          return settings.topic_list_thumbnail_first_x_rows;
        },

        applyTiles() {
          resizeAllGridItems();
        },
      });

      api.modifyClass("component:topic-list-item", {
        pluginId: PLUGIN_ID,
        topicListPreviewsService: service("topic-list-previews"),
        canBookmark: bool("currentUser"),
        classNameBindings: ["whiteText:white-text", "blackText:black-text", "hasThumbnail", "tilesStyle:tiles-grid-item"],
        tilesStyle: readOnly("topicListPreviewsService.displayTiles"),
        notTilesStyle: not("topicListPreviewsService.displayTiles"),
        showThumbnail: readOnly("topicListPreviewsService.displayThumbnails"),
        showExcerpt: readOnly("topicListPreviewsService.displayExcerpts"),
        showActions: and(
          "topic.sidecar_installed",
          "topicListPreviewsService.displayActions"
        ),
        thumbnailFirstXRows: alias("parentView.thumbnailFirstXRows"),
        category: alias("parentView.category"),
        thumbnails: alias("topic.thumbnails"),
        hasThumbnail: false,
        averageIntensity: null,
        thumbnailIsLoaded: false,
        background: null,
        backgroundGradient: null,
        attributeBindings: ["style"],
        style: alias("background"),
        likeCount: 0,
        hasLiked: false,
        canUnlike: true,

        @discourseComputed("averageIntensity")
        whiteText() {
          if (this.averageIntensity > 127) {
            return false;
          } else {
            return this.averageIntensity;
          }
        },

        @discourseComputed("whiteText")
        blackText() {
          return !this.whiteText && this.averageIntensity;
        },

        // Lifecyle logic

        @on("init")
        _setupProperties() {
          const topic = this.get("topic");
          const thumbnails = topic.get("thumbnails");
          const currentUser = this.get("currentUser");
          const defaultThumbnail = this.get("defaultThumbnail");
          this.set("likeCount", topic.like_count);
          this.set("hasLiked", topic.topic_post_liked);
          this.set("canUnlike", topic.topic_post_can_unlike);
          this.set("hasThumbnail", (this.get("thumbnails") || settings.topic_list_default_thumbnail) && this.get("showThumbnail"));
          this._setUpColour();
          if (this.get("tilesStyle")) {
            // needs 'div's for masonry
            this.set("tagName", "div");
            this.set("classNames", this.classNames.concat("tiles-grid-item"));
            if (settings.topic_list_tiles_larger_featured_tiles && topic.tags) {
              if (
                topic.tags.filter(
                  (tag) => this.get("featuredTags").indexOf(tag) > -1
                )[0]
              ) {
                this.set(
                  "classNames",
                  this.classNames.concat("tiles-grid-item-width2")
                );
              }
            }
            const raw = topic.excerpt;
            cook(raw).then((cooked) => this.set("excerpt", cooked));
          }

          const obj = PostsCountColumn.create({ topic });
          obj.siteSettings = settings;
          this.set("likesHeat", obj.get("likesHeat"));
        },

        @on("didInsertElement")
        _setupDOM() {
          const thumbnails = this.get("topic").get("thumbnails");
          const thumbnailFirstXRows = this.get("thumbnailFirstXRows");
          if (thumbnails && thumbnailFirstXRows) {
            let parent = this.element.parentNode;
            let index = Array.prototype.indexOf.call(
              parent.children,
              this.element
            );
            if (index > thumbnailFirstXRows) {
              this.set("hasThumbnail", false);
              this.renderTopicListItem();
            }
          }
          this._afterRender();
        },

        @observes("thumbnails",
          "bulkSelectEnabled",
          "topic.pinned",
          "likeDifference",
          "showThumbnail",
          "tilesStyle",
          "showExcerpt",
          "showActions"
        )
        _reRender() {
          this.set("hasThumbnail", this.get("thumbnails") && this.get("showThumbnail"));
          this.renderTopicListItem();
          this._afterRender();
        },

        _afterRender() {
          scheduleOnce("afterRender", this, () => {
            if (this.get("showActions")) {
              this._setupActions();
            }
          });
        },

        @discourseComputed
        featuredTags() {
          return settings.topic_list_featured_images_tag.split("|");
        },

        @discourseComputed
        abbreviatePosters() {
          return (this.topic.posters.length > 3);
        },

        @discourseComputed
        abbreviatedPosters() {
          let abbreviatedPosters = [];
          if (this.topic.posters.length < 6) {
            abbreviatedPosters = this.topic.posters
          } else {
            this.topic.posters[0].count = false;
            abbreviatedPosters.push(this.topic.posters[0]);
            this.topic.posters[1].count = false;
            abbreviatedPosters.push(this.topic.posters[1]);
            let count = {count: this.topic.posters.length - 4}
            abbreviatedPosters.push(count);
            this.topic.posters[this.topic.posters.length - 2].count = false;
            abbreviatedPosters.push(this.topic.posters[this.topic.posters.length - 2]);
            this.topic.posters[this.topic.posters.length - 1].count = false;
            abbreviatedPosters.push(this.topic.posters[this.topic.posters.length - 1]);
          }
          return abbreviatedPosters;
        },

        _setUpColour () {
          let red = this.get("topic.dominant_colour.red") || 0;
          let green = this.get("topic.dominant_colour.green") || 0;
          let blue = this.get("topic.dominant_colour.blue") || 0;

          let newRgb = "rgb(" + red + "," + green + "," + blue + ")";

          let averageIntensity =  this.get("topic.dominant_colour") ? (red + green + blue) / 3 : null;

          let maskBackground = `rgba(255, 255, 255, 0) linear-gradient(to bottom, rgba(0, 0, 0, 0) 10%, rgba(${red}, ${green}, ${blue}, .1) 40%, rgba(${red}, ${green}, ${blue}, .5) 75%, rgba(${red}, ${green}, ${blue}, 1) 100%);`;
          if (averageIntensity) {
            this.set("averageIntensity", averageIntensity);
            this.set("background", htmlSafe(`background: ${newRgb};`));
            this.set("backgroundGradient", htmlSafe(`background: ${maskBackground}`));
          }
        },

        _setupActions() {
          if (this._state === "destroying") return;

          let postId = this.get("topic.topic_post_id"),
            bookmarkElement = this.element.querySelector(".topic-bookmark"),
            likeElement = this.element.querySelector(".topic-like"),
            shareElement = this.element.querySelector(".topic-share");

          let debouncedToggleBookmark = (() => {
            this.debouncedToggleBookmark(this);
          }).bind(this);

          let debouncedToggleLike = (() => {
            this.debouncedToggleLike(this);
          }).bind(this);

          let debouncedShare = (() => {
            this.debouncedShare(this);
          }).bind(this);

          if (bookmarkElement) {
            bookmarkElement.addEventListener("click", debouncedToggleBookmark);
          }
          if (likeElement) {
            likeElement.addEventListener("click", debouncedToggleLike);
          }
          if (shareElement) {
            shareElement.addEventListener("click", debouncedShare);
          }
        },

        // Overrides

        @discourseComputed()
        expandPinned() {
          if (this.get("showExcerpt")) {
            return true;
          }
          return this._super();
        },

        // Display objects

        @discourseComputed()
        posterNames() {
          let posters = this.get("topic.posters");
          let posterNames = "";
          posters.forEach((poster, i) => {
            let name = poster.user.name
              ? poster.user.name
              : poster.user.username;
            posterNames +=
              '<a href="' +
              poster.user.path +
              '" data-user-card="' +
              poster.user.username +
              '" + class="' +
              poster.extras +
              '">' +
              name +
              "</a>";
            if (i === posters.length - 2) {
              posterNames += "<span> & </span>";
            } else if (i !== posters.length - 1) {
              posterNames += "<span>, </span>";
            }
          });
          return posterNames;
        },

        @discourseComputed
        defaultThumbnail() {
          return getDefaultThumbnail();
        },

        @discourseComputed("tilesStyle", "thumbnailWidth", "thumbnailHeight")
        thumbnailOpts(tilesStyle, thumbnailWidth, thumbnailHeight) {
          let opts = {
            tilesStyle,
          };

          if (thumbnailWidth) {
            opts["thumbnailWidth"] = thumbnailWidth;
          }

          if (thumbnailHeight) {
            opts["thumbnailHeight"] = thumbnailHeight;
          }

          return opts;
        },

        @discourseComputed("likeCount")
        topicActions(likeCount) {
          let actions = [];
          if (
            likeCount ||
            this.get("topic.topic_post_can_like") ||
            !this.get("currentUser") ||
            settings.topic_list_show_like_on_current_users_posts
          ) {
            actions.push(this._likeButton());
          }
          actions.push(this._shareButton());
          if (this.get("canBookmark")) {
            actions.push(this._bookmarkButton());
            scheduleOnce("afterRender", this, () => {
              let bookmarkStatusElement = this.element.querySelector(
                ".topic-statuses .op-bookmark"
              );
              if (bookmarkStatusElement) {
                bookmarkStatusElement.style.display = "none";
              }
            });
          }
          return actions;
        },

        @discourseComputed("hasLiked")
        hasLikedDisplay() {
          let hasLiked = this.get("hasLiked");
          return hasLiked == null
            ? this.get("topic.topic_post_liked")
            : hasLiked;
        },

        @discourseComputed("category", "topic.isPinnedUncategorized")
        showCategoryBadge(category, isPinnedUncategorized) {
          const isTopic = typeof topic !== "undefined";
          return (
            (isTopic || !category || category.has_children) &&
            !isPinnedUncategorized
          );
        },

        _shareButton() {
          let classes = "topic-share";
          return {
            type: "share",
            class: classes,
            title: "js.topic.share.help",
            icon: "link",
            topic: this.topic,
          };
        },

        _likeButton() {
          let classes = "topic-like";
          let disabled = this.get("topic.topic_post_is_current_users");

          if (this.get("hasLiked")) {
            classes += " has-like";
            disabled = disabled ? true : !this.get("canUnlike");
          }
          return {
            type: "like",
            class: classes,
            title: "post.controls.like",
            icon: "heart",
            disabled: disabled,
            topic_id: this.topic.id,
            topic_post_id: this.topic.topic_post_id,
            like_count: this.likeCount,
            has_liked: this.hasLiked,
          };
        },

        _bookmarkButton() {
          var classes = "topic-bookmark",
            title = "bookmarks.not_bookmarked";
          if (this.get("topic.topic_post_bookmarked")) {
            classes += " bookmarked";
            title = "bookmarks.remove";
          }
          return {
            type: "bookmark",
            class: classes,
            title: title,
            icon: "bookmark",
            topic_id: this.topic.id,
            topic_post_id: this.topic.topic_post_id,
          };
        },

        // Action toggles and server methods

        debouncedShare() {
          debounce(
            this,
            () => {
              shareTopic(
                this.topic,
              );
            },
            500
          );
        },

        debouncedToggleBookmark() {
          debounce(
            this,
            () => {
              sendBookmark(
                this.topic.id,
                this.topic.topic_post_id,
                !this.topic.bookmarked
              );
              this.topic.bookmarked = !this.topic.bookmarked;
              let bookmarkElement =
                this.element.querySelector(".topic-bookmark");
              bookmarkElement.classList.toggle("bookmarked");
              let title = I18n.t("bookmarks.not_bookmarked");
              if (this.topic.bookmarked) {
                title = I18n.t("bookmarks.remove");
              }
              bookmarkElement.title = title;
            },
            500
          );
        },

        debouncedToggleLike() {
          if (this.get("currentUser")) {
            debounce(
              this,
              () => {
                let change = 0;

                if (this.get("hasLiked")) {
                  removeLike(this.topic.topic_post_id);
                  change = -1;
                } else {
                  addLike(this.topic.topic_post_id);
                  change = 1;
                  this.set("canUnlike", true);
                  //TODO improve this so it doesn't update UI upon failure to like
                  //TODO add back animation?
                }
                let newText = "";
                let count = this.get("likeCount");
                let newCount = (count || 0) + (change || 0);
                this.set("hasLiked", !this.get("hasLiked"));
                this.set("topic.topic_post_like_count", newCount);
                this.set("likeCount", newCount);
                this.renderTopicListItem();
                this._afterRender();
              },
              500
            );
          } else {
            const controller = container.lookup("controller:application");
            controller.send("showLogin");
          }
        },

        _titleElement() {
          if (this.element !== undefined && this.element !== null) {
            return this.element.querySelector(".main-link .title");
          } else {
            return false;
          }
        },
      });

      api.modifyClass("component:search-result-entries", {
        pluginId: PLUGIN_ID,
        tagName: "div",
        classNameBindings: ["thumbnailGrid:thumbnail-grid"],

        @discourseComputed
        thumbnailGrid() {
          const siteSettings = container.lookup("service:site-settings");
          return siteSettings.topic_list_search_previews_enabled
        },
      });

      api.modifyClass("component:search-result-entry", {
        pluginId: PLUGIN_ID,

        @discourseComputed
        thumbnailGrid() {
          const siteSettings = container.lookup("service:site-settings");
          return siteSettings.topic_list_search_previews_enabled
        },

        @discourseComputed
        thumbnailOpts() {
          let opts = { tilesStyle: true };

          opts["thumbnailWidth"] = "100";

          return opts;
        },
      });

      api.modifyClass("component:topic-timeline", {
        pluginId: PLUGIN_ID,
        @on("didInsertElement")
        refreshTimelinePosition() {
          this.appEvents.on("topic:refresh-timeline-position", this, () =>
            this.queueDockCheck()
          );
        },

        @on("willDestroyElement")
        removeRefreshTimelinePosition() {
          try {
            this.appEvents.off("topic:refresh-timeline-position", this, () =>
              this.queueDockCheck()
            );
          } catch (err) {
            console.log(err.message);
          }
        },
      });
    });
  },
};
