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
          console.log("was here");
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
          if (settings.topic_list_fade_in_time) {
            this.element.querySelector("#list-area").fadeOut(0);
          }
        },

        @on("didRender")
        completeRender() {
          if (this.get("hasTiles")) {
            Ember.run.scheduleOnce("afterRender", this, this.applyTiles);
          }
          if (settings.topic_list_fade_in_time) {
            this.element
              .querySelector("#list-area")
              .fadeIn(settings.topic_list_fade_in_time);
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
        classNameBindings: ["whiteText:white-text:black-text", "hasThumbnail"],
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
        averageIntensity: null,
        thumbnailIsLoaded: false,
        background: null,
        backgroundGradient: null,
        attributeBindings: ["style"],
        style: htmlSafe(""),

        @discourseComputed("averageIntensity")
        whiteText() {
          if (this.averageIntensity > 127) {
            return false;
          } else {
            return true;
          }
        },

        @discourseComputed("background")
        backgroundStyle(background) {
          return htmlSafe(background);
        },

        @discourseComputed("backgroundGradient")
        backgroundGradientStyle(backgroundGradient) {
          return htmlSafe(backgroundGradient);
        },

        // Lifecyle logic

        @on("init")
        _setupProperties() {
          const topic = this.get("topic");
          const thumbnails = topic.get("thumbnails");
          const defaultThumbnail = this.get("defaultThumbnail");

          if (this.get("tilesStyle")) {
            // needs 'div's for masonry
            this.set("tagName", "div");
            this.classNames = ["tiles-grid-item"];

            if (settings.topic_list_tiles_larger_featured_tiles && topic.tags) {
              if (
                topic.tags.filter(
                  (tag) => this.get("featuredTags").indexOf(tag) > -1
                )[0]
              ) {
                this.classNames.push("tiles-grid-item-width2");
              }
            }
            const raw = topic.excerpt;
            cookAsync(raw).then((cooked) => this.set("excerpt", cooked));
          }

          if (thumbnails) {
            testImageUrl(thumbnails, (imageLoaded) => {
              if (!imageLoaded) {
                Ember.run.scheduleOnce("afterRender", this, () => {
                  if (defaultThumbnail) {
                    const $thumbnail =
                      this.element.querySelector("img.thumbnail");
                    if ($thumbnail) $thumbnail.attr("src", defaultThumbnail);
                  } else {
                    const $container =
                      this.element.querySelector(".topic-thumbnail");
                    if ($container) $container.style.display = "none";
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
          if (
            topic.get("thumbnails") &&
            this.get("thumbnailFirstXRows") &&
            this.element.index() > this.get("thumbnailFirstXRows")
          ) {
            this.set("showThumbnail", false);
          }
          this._afterRender();
        },

        updateLoadStatus() {
          console.log("hello middle");
          this.set("thumbnailIsLoaded", true);
          this.updateBackgroundStyle();
        },

        _afterRender() {
          Ember.run.scheduleOnce("afterRender", this, () => {
            this._setupTitleCSS();
            if (this.get("showActions")) {
              this._setupActions();
            }
          });
        },

        @discourseComputed
        featuredTags() {
          return settings.topic_list_featured_images_tag.split("|");
        },

        _setupTitleCSS() {
          let $el = this.element.querySelector(".topic-title a.visited");
          if ($el) {
            $el.closest(".topic-details").addClass("visited");
          }
        },

        _setupActions() {
          if (this._state === "destroying") return;

          let postId = this.get("topic.topic_post_id"),
            bookmarkElement = this.element.querySelector(".topic-bookmark"),
            likeElement = this.element.querySelector(".topic-like");
          if (bookmarkElement) {
            bookmarkElement.addEventListener(
              "click",
              this.debouncedToggleBookmark
            );
          }
          if (likeElement) {
            likeElement.addEventListener("click", this.debouncedToggleLike);
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
              let $bookmarkStatus = this.element.querySelector(
                ".topic-statuses .op-bookmark"
              );
              if ($bookmarkStatus) {
                $bookmarkStatus.style.display = "none";
              }
            });
          }
          return actions;
        },

        @discourseComputed("likeDifference")
        likeCount(likeDifference) {
          return (
            (likeDifference == null
              ? this.get("topic.topic_post_like_count")
              : likeDifference) || 0
          );
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

        changeLikeCount(change) {
          let count = this.get("likeCount"),
            newCount = count + (change || 0);
          this.set("hasLiked", Boolean(change > 0));
          this.set("likeDifference", newCount);
          this.renderTopicListItem();
          this._afterRender();
        },

        _likeButton() {
          let classes = "topic-like";
          let disabled = this.get("topic.topic_post_is_current_users");

          if (this.get("hasLikedDisplay")) {
            classes += " has-like";
            let unlikeDisabled = this.get("topic.topic_post_can_unlike")
              ? false
              : this.get("likeDifference") == null;
            disabled = disabled ? true : unlikeDisabled;
          }
          return {
            type: "like",
            class: classes,
            title: "post.controls.like",
            icon: "heart",
            disabled: disabled,
            topic_id: this.topic.id,
            topic_post_id: this.topic.topic_post_id,
            like_count: this.topic.like_count,
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
                this.dataset.topic_id,
                this.dataset.topic_post_id,
                !this.classList.contains("bookmarked")
              );
              this.classList.toggle("bookmarked");
            },
            500
          );
        },

        debouncedToggleLike() {
          Ember.run.debounce(
            this,
            () => {
              let change = 0;
              if (this.classList.contains("has-like")) {
                removeLike(this.dataset.topic_post_id);
                this.classList.toggle("has-like");
                change = -1;
              } else {
                addLike(this.dataset.topic_post_id);
                this.classList.toggle("has-like");
                change = 1;
                //TODO add back animation?
              }
              let newText = "";
              let count = parseInt(this.querySelector(".like-count").innerHTML);
              let newCount = (count || 0) + (change || 0);
              this.querySelector(".like-count").innerHTML =
                newCount > 0 ? newCount : "";
            },
            500
          );
        },

        actions: {
          onChangeColor(colors) {
            if (this.tilesStyle) {
              let newRgb =
                "rgb(" +
                colors[0] +
                "," +
                colors[1] +
                "," +
                colors[2] +
                ")";

              let averageIntensity =
                (colors[0] + colors[1] + colors[2]) / 3;

              let maskBackground = `rgba(255, 255, 255, 0) linear-gradient(to bottom, rgba(0, 0, 0, 0) 10%, rgba(${colors[0]}, ${colors[1]}, ${colors[2]}, .1) 40%, rgba(${colors[0]}, ${colors[1]}, ${colors[2]}, .5) 75%, rgba(${colors[0]}, ${colors[1]}, ${colors[2]}, 1) 100%);`;
              this.set("averageIntensity", averageIntensity);
              this.set("background", htmlSafe(`background: ${newRgb};`));
              this.set("backgroundGradient", htmlSafe(`background: ${maskBackground}`));

              let imageMask =
                  this.element.lastElementChild.firstElementChild.lastElementChild.firstElementChild

              imageMask.style = this.get("backgroundGradient");
              this.element.style = this.get("background");
            }
          },
        },
      });
    });
  },
};
