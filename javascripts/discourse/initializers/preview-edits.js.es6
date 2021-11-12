import discourseComputed, {
  on,
  observes,
} from "discourse-common/utils/decorators";
import { alias, and, equal, not } from "@ember/object/computed";
import DiscourseURL from "discourse/lib/url";
import { testImageUrl, getDefaultThumbnail } from "../lib/tlp-utilities";
import { addLike, sendBookmark, removeLike } from "../lib/actions";
import { withPluginApi } from "discourse/lib/plugin-api";
import PostsCountColumn from "discourse/raw-views/list/posts-count-column";
import { resizeAllGridItems } from "../lib/gridupdate";
import Topic from "discourse/models/topic";
import loadScript from "discourse/lib/load-script";
import { cookAsync } from "discourse/lib/text";
import { debounce } from "@ember/runloop";
import { inject as service } from "@ember/service";
import { readOnly } from "@ember/object/computed";
import { computed } from "@ember/object";
import { htmlSafe } from "@ember/template";
import { RUNTIME_OPTIONS } from "discourse-common/lib/raw-handlebars-helpers";
import { findRawTemplate } from "discourse-common/lib/raw-templates";

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
            Ember.run.scheduleOnce("afterRender", this, this.applyTiles);
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
        canBookmark: Ember.computed.bool("currentUser"),
        rerenderTriggers: [
          "bulkSelectEnabled",
          "topic.pinned",
          "likeDifference",
          "topic.thumbnails",
        ],

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
        hasThumbnail: and("topic.thumbnails", "showThumbnail"),
        likeCount: 0,
        hasLiked: false,
        canUnlike: true,

        // Lifecyle logic

        @on("init")
        _setupProperties() {
          const topic = this.get("topic");
          const thumbnails = topic.get("thumbnails");
          const currentUser = this.get("currentUser");
          const defaultThumbnail = this.get("defaultThumbnail");
          this.set('likeCount', topic.like_count);
          this.set('hasLiked', topic.topic_post_liked);
          this.set('canUnlike', topic.topic_post_can_unlike);

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
                this.set('classNames', this.classNames.concat("tiles-grid-item-width2"));
              }
            }
            const raw = topic.excerpt;
            cookAsync(raw).then((cooked) => this.set("excerpt", cooked));
          }

          if (thumbnails) {
            testImageUrl(thumbnails, currentUser, (imageLoaded) => {
              if (!imageLoaded) {
                Ember.run.scheduleOnce("afterRender", this, () => {
                  if (defaultThumbnail) {
                    const thumbnailElement =
                      this.element.querySelector("img.thumbnail");
                    if (thumbnailElement) thumbnailElement.src = defaultThumbnail; 
                  } else {
                    const containerElement =
                      this.element.querySelector(".topic-thumbnail");
                    if (containerElement) containerElement.style.display = "none";
                  }
                });
              }
            });
          } else if (
            defaultThumbnail &&
            settings.topic_list_default_thumbnail_fallback
          ) {
            this.set("thumbnails", [{ url: defaultThumbnail }]);
          }

          const obj = PostsCountColumn.create({ topic });
          obj.siteSettings = settings;
          this.set("likesHeat", obj.get("likesHeat"));
        },

        @on("didInsertElement")
        _setupDOM() {
          const topic = this.get("topic");
          let parent = this.element.parentNode;
          let index = Array.prototype.indexOf.call(parent.children, this.element);
          if (
            topic.get("thumbnails") &&
            this.get("thumbnailFirstXRows") &&
            index > this.get("thumbnailFirstXRows")
          ) {
            this.set("showThumbnail", false);
          }
          this._afterRender();
        },

        @observes("thumbnails")
        _afterRender() {
          Ember.run.scheduleOnce("afterRender", this, () => {
            if (this.get("showActions")) {
              this._setupActions();
            }
          });
        },

        @discourseComputed
        featuredTags() {
          return settings.topic_list_featured_images_tag.split("|");
        },

        _setupActions() {
          if (this._state === "destroying") return;

          let postId = this.get("topic.topic_post_id"),
            bookmarkElement = this.element.querySelector(".topic-bookmark"),
            likeElement = this.element.querySelector(".topic-like");

          let debouncedToggleBookmark = (() => {
            this.debouncedToggleBookmark(this);
          }).bind(this);

          let debouncedToggleLike = (() => {
            this.debouncedToggleLike(this);
          }).bind(this);

          if (bookmarkElement) {
            bookmarkElement.addEventListener("click", debouncedToggleBookmark);
          }
          if (likeElement) {
            likeElement.addEventListener("click", debouncedToggleLike);
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
          if (this.get("canBookmark")) {
            actions.push(this._bookmarkButton());
            Ember.run.scheduleOnce("afterRender", this, () => {
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

        _likeButton() {
          let classes = "topic-like";
          let disabled = this.get ('topic.topic_post_is_current_users');

          if (this.get("hasLiked")) {
            classes += " has-like";
            disabled = disabled ? true : !this.get('canUnlike');
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
            has_liked: this.hasLiked
          };
        },

        _bookmarkButton() {
          var classes = "topic-bookmark",
            title = "bookmarks.not_bookmarked";
          if (this.get("topic.topic_post_bookmarked")) {
            classes += " bookmarked";
            title = "bookmarks.created";
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

        debouncedToggleBookmark() {
          Ember.run.debounce(
            this,
            () => {
              sendBookmark(
                this.topic.id,
                this.topic.topic_post_id,
                !this.topic.bookmarked
              );
              this.topic.bookmarked = !this.topic.bookmarked;
              let bookmarkElement = this.element.querySelector(".topic-bookmark");
              bookmarkElement.classList.toggle("bookmarked");
            },
            500
          );
        },

        debouncedToggleLike() {
          if (this.get ('currentUser')) {
            Ember.run.debounce(
              this,
              () => {
                let change = 0;

                if (this.get('hasLiked')) {
                  removeLike(this.topic.topic_post_id);
                  change = -1;
                } else {
                  addLike(this.topic.topic_post_id);
                  change = 1;
                  this.set('canUnlike', true);
                  //TODO improve this so it doesn't update UI upon failure to like
                  //TODO add back animation?
                }
                let newText = "";
                let count = this.get('likeCount');
                let newCount = (count || 0) + (change || 0);
                this.set ('hasLiked', !this.get('hasLiked'));
                this.set('topic.topic_post_like_count', newCount);
                this.set ('likeCount', newCount);
                this.renderTopicListItem ();
                this._afterRender ();
              },
              500
            )
          } else {
            const controller = container.lookup ('controller:application');
            controller.send ('showLogin');
          }
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
