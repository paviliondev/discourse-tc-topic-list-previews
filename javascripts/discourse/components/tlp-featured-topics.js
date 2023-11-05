import { cook } from 'discourse/lib/text';
import { action, computed } from "@ember/object";
import Component from '@glimmer/component';
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";
import {findOrResetCachedTopicList} from 'discourse/lib/cached-topic-list';

export default class TlpFeaturedTopicsComponent extends Component {
  @service appEvents;
  @service store;
  @service session;
  @tracked featuredTitle = "";
  @tracked featuredTopics = [];

  constructor() {
    super(...arguments);
    this.appEvents.trigger('topic:refresh-timeline-position');

    if (this.showFeaturedTitle) {
      const raw = settings.topic_list_featured_title;
      cook(raw).then((cooked) => this.featuredTitle = cooked);
    };
  };

  @action
  async getFeaturedTopics() {
    let topics = [];
    if (settings.topic_list_featured_images_tag !== "") {
      let filter = `tag/${settings.topic_list_featured_images_tag}`;
      let lastTopicList = findOrResetCachedTopicList (this.session, filter);
      let list = await this.store.findFiltered ('topicList', {filter} );

      if (typeof list !== 'undefined') {
          topics = Ember.Object.create(list).topic_list.topics;

        if (this.args.category && settings.topic_list_featured_images_from_current_category_only) {
          topics = topics.filter(topic => topic.category_id == this.args.category.id)
        };

        const reducedTopics = topics ? settings.topic_list_featured_images_count == 0 ? topics : topics.slice(0,settings.topic_list_featured_images_count) : [];

        if (settings.topic_list_featured_images_created_order) {
          reducedTopics.sort((a, b) => {
            var keyA = new Date(a.created_at), keyB = new Date(b.created_at);
            // Compare the 2 dates
            if (keyA < keyB) return 1;
            if (keyA > keyB) return -1;
            return 0;
          });
        }
        this.featuredTopics = reducedTopics;
      }
    }
  };

  @computed("featuredTopics")
  get showFeatured() {
    return (settings.topic_list_featured_images && 
    this.args.category == null ||
    settings.topic_list_featured_images_category &&
    this.args.category !== null) &&
    this.featuredTopics.length > 0;
  };

  @computed
  get showFeaturedTitle() {
    return settings.topic_list_featured_title;
  };

  @computed
  get featuredTags() {
    return settings.topic_list_featured_images_tag.split('|');
  };

  @computed
  get showFeaturedTags() {
    return this.featuredTags &&
           settings.topic_list_featured_images_tag_show;
  };
};
