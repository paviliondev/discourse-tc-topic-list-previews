import { cook } from 'discourse/lib/text';
import { computed } from "@ember/object";
import Component from '@glimmer/component';
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";

export default class TlpFeaturedTopicsComponent extends Component {
  @service appEvents;
  @tracked featuredTitle = "";

  constructor() {
    super(...arguments);
    this.appEvents.trigger('topic:refresh-timeline-position');

    if (this.showFeaturedTitle) {
      const raw = settings.topic_list_featured_title;
      cook(raw).then((cooked) => this.featuredTitle = cooked);
    }
  };

  @computed
  get hasTopics() {
    return this.args.featuredTopics.length > 0;
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
