import { inject as service } from "@ember/service";
import { computed } from "@ember/object";
import Component from '@glimmer/component';

export default class TlpFeaturedTopicComponent extends Component {
  @service currentUser;

  @computed
  get featuredUser() {
    return this.args.topic.posters[0].user;
  };

  @computed
  get featuredUsername() {
    return this.args.topic.posters[0].user.username;
  };

  @computed
  get featuredExcerpt() {
    return (settings.topic_list_featured_excerpt > 0 && this.args.topic.excerpt) ? this.args.topic.excerpt.slice(0,settings.topic_list_featured_excerpt) : false;
  };

  @computed
  get featuredTags() {
    return settings.topic_list_featured_images_tag.split('|');
  };

  @computed('args.topic.tags')
  get featuredTag() {
    return this.args.topic.tags.filter(tag => this.featuredTags.indexOf(tag) > -1)[0];
  };

  @computed('args.topic.id')
  get href() {
    return `/t/${this.args.topic.id}`;
  };
};
